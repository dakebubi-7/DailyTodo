#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <windowsx.h>

#include <atomic>
#include <cstdio>
#include <unordered_map>

namespace {

struct DragRegion {
  RECT rect{};
  bool enabled = false;
  bool minimize_protection_enabled = false;
  WNDPROC original_proc = nullptr;
};

SRWLOCK g_regions_lock = SRWLOCK_INIT;
std::unordered_map<HWND, DragRegion> g_regions;
std::atomic_uint g_trace_count = 0;

void WriteTraceLine(const wchar_t* text) {
  wchar_t app_data[MAX_PATH]{};
  const DWORD length = GetEnvironmentVariableW(L"APPDATA", app_data, MAX_PATH);
  if (length == 0 || length >= MAX_PATH) return;

  wchar_t path[MAX_PATH]{};
  swprintf_s(path, L"%s\\daily-todo\\native-drag-trace.log", app_data);
  FILE* file = nullptr;
  if (_wfopen_s(&file, path, L"a, ccs=UTF-8") != 0 || !file) return;
  fwprintf(file, L"%s\n", text);
  fclose(file);
}

const wchar_t* DragMessageName(UINT message) {
  switch (message) {
    case WM_NCHITTEST: return L"WM_NCHITTEST";
    case WM_NCLBUTTONDOWN: return L"WM_NCLBUTTONDOWN";
    case WM_LBUTTONDOWN: return L"WM_LBUTTONDOWN";
    case WM_ENTERSIZEMOVE: return L"WM_ENTERSIZEMOVE";
    case WM_EXITSIZEMOVE: return L"WM_EXITSIZEMOVE";
    default: return nullptr;
  }
}

void TraceDragMessage(HWND hwnd, UINT message, WPARAM w_param, LPARAM l_param) {
  const auto message_name = DragMessageName(message);
  if (!message_name || g_trace_count.fetch_add(1) >= 80) return;

  wchar_t trace_enabled[2]{};
  if (GetEnvironmentVariableW(L"DAILYTODO_HIT_TEST_TRACE", trace_enabled, 2) == 0) return;

  wchar_t line[256]{};
  swprintf_s(line, L"%s hwnd=%p wParam=%llu lParam=%lld", message_name, hwnd,
    static_cast<unsigned long long>(w_param), static_cast<long long>(l_param));
  WriteTraceLine(line);
}

bool PointIsInDragRegion(HWND hwnd, LPARAM l_param) {
  POINT point{ GET_X_LPARAM(l_param), GET_Y_LPARAM(l_param) };
  if (!ScreenToClient(hwnd, &point)) return false;

  AcquireSRWLockShared(&g_regions_lock);
  const auto found = g_regions.find(hwnd);
  const bool is_caption = found != g_regions.end()
    && found->second.enabled
    && PtInRect(&found->second.rect, point);
  ReleaseSRWLockShared(&g_regions_lock);
  return is_caption;
}

bool IsMinimizeProtectionEnabled(HWND hwnd) {
  AcquireSRWLockShared(&g_regions_lock);
  const auto found = g_regions.find(hwnd);
  const bool enabled = found != g_regions.end() && found->second.minimize_protection_enabled;
  ReleaseSRWLockShared(&g_regions_lock);
  return enabled;
}

LRESULT CALLBACK HitTestWindowProc(HWND hwnd, UINT message, WPARAM w_param, LPARAM l_param) {
  TraceDragMessage(hwnd, message, w_param, l_param);

  if (message == WM_SYSCOMMAND
    && (w_param & 0xFFF0) == SC_MINIMIZE
    && IsMinimizeProtectionEnabled(hwnd)) {
    return 0;
  }

  if (message == WM_NCHITTEST && PointIsInDragRegion(hwnd, l_param)) {
    return HTCAPTION;
  }

  // Transparent Electron windows can consume the caption press after their
  // hit-test result. Let Windows itself handle this exact non-client message.
  if (message == WM_NCLBUTTONDOWN && w_param == HTCAPTION) {
    return DefWindowProcW(hwnd, message, w_param, l_param);
  }

  WNDPROC original_proc = nullptr;
  AcquireSRWLockShared(&g_regions_lock);
  const auto found = g_regions.find(hwnd);
  if (found != g_regions.end()) original_proc = found->second.original_proc;
  ReleaseSRWLockShared(&g_regions_lock);

  const LRESULT result = original_proc
    ? CallWindowProcW(original_proc, hwnd, message, w_param, l_param)
    : DefWindowProcW(hwnd, message, w_param, l_param);

  if (message == WM_NCDESTROY) {
    AcquireSRWLockExclusive(&g_regions_lock);
    g_regions.erase(hwnd);
    ReleaseSRWLockExclusive(&g_regions_lock);
  }

  return result;
}

}

extern "C" __declspec(dllexport) BOOL __stdcall InstallWindowHitTest(HWND hwnd) {
  if (!IsWindow(hwnd)) {
    WriteTraceLine(L"InstallWindowHitTest rejected an invalid window");
    return FALSE;
  }

  AcquireSRWLockExclusive(&g_regions_lock);
  if (g_regions.contains(hwnd)) {
    WriteTraceLine(L"InstallWindowHitTest reused the existing subclass");
    ReleaseSRWLockExclusive(&g_regions_lock);
    return TRUE;
  }

  SetLastError(0);
  const auto original_proc = reinterpret_cast<WNDPROC>(
    SetWindowLongPtrW(hwnd, GWLP_WNDPROC, reinterpret_cast<LONG_PTR>(HitTestWindowProc)));
  if (!original_proc && GetLastError() != 0) {
    WriteTraceLine(L"InstallWindowHitTest failed to subclass the window");
    ReleaseSRWLockExclusive(&g_regions_lock);
    return FALSE;
  }

  g_regions.emplace(hwnd, DragRegion{ {}, false, false, original_proc });
  WriteTraceLine(L"InstallWindowHitTest installed the subclass");
  ReleaseSRWLockExclusive(&g_regions_lock);
  return TRUE;
}

extern "C" __declspec(dllexport) BOOL __stdcall SetWindowMinimizeProtection(
  HWND hwnd,
  BOOL enabled) {
  if (!InstallWindowHitTest(hwnd)) return FALSE;

  AcquireSRWLockExclusive(&g_regions_lock);
  const auto found = g_regions.find(hwnd);
  if (found == g_regions.end()) {
    WriteTraceLine(L"SetWindowMinimizeProtection failed because no subclass was installed");
    ReleaseSRWLockExclusive(&g_regions_lock);
    return FALSE;
  }

  found->second.minimize_protection_enabled = enabled != FALSE;
  WriteTraceLine(found->second.minimize_protection_enabled
    ? L"SetWindowMinimizeProtection enabled"
    : L"SetWindowMinimizeProtection disabled");
  ReleaseSRWLockExclusive(&g_regions_lock);
  return TRUE;
}

extern "C" __declspec(dllexport) BOOL __stdcall SetWindowDragRegion(
  HWND hwnd,
  int left,
  int top,
  int right,
  int bottom,
  BOOL enabled) {
  AcquireSRWLockExclusive(&g_regions_lock);
  const auto found = g_regions.find(hwnd);
  if (found == g_regions.end()) {
    WriteTraceLine(L"SetWindowDragRegion failed because no subclass was installed");
    ReleaseSRWLockExclusive(&g_regions_lock);
    return FALSE;
  }

  found->second.rect = RECT{ left, top, right, bottom };
  found->second.enabled = enabled != FALSE && right > left && bottom > top;
  WriteTraceLine(L"SetWindowDragRegion updated the caption rectangle");
  ReleaseSRWLockExclusive(&g_regions_lock);
  return TRUE;
}

extern "C" __declspec(dllexport) void __stdcall UninstallWindowHitTest(HWND hwnd) {
  AcquireSRWLockExclusive(&g_regions_lock);
  const auto found = g_regions.find(hwnd);
  if (found != g_regions.end()) {
    if (IsWindow(hwnd)) {
      SetWindowLongPtrW(hwnd, GWLP_WNDPROC, reinterpret_cast<LONG_PTR>(found->second.original_proc));
    }
    g_regions.erase(found);
  }
  ReleaseSRWLockExclusive(&g_regions_lock);
}
