#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <windowsx.h>
#include <d3d11.h>
#include <dcomp.h>
#include <dxgi.h>

#include <memory>

namespace {

constexpr wchar_t kWindowClassName[] = L"DailyTodoDirectCompositionProbe";
constexpr wchar_t kWindowTitle[] = L"DailyTodo Native Glass Probe";

enum WINDOWCOMPOSITIONATTRIB {
  WCA_ACCENT_POLICY = 19,
};

enum ACCENT_STATE {
  ACCENT_DISABLED = 0,
  ACCENT_ENABLE_BLURBEHIND = 3,
  ACCENT_ENABLE_ACRYLICBLURBEHIND = 4,
};

struct ACCENT_POLICY {
  int AccentState;
  int AccentFlags;
  DWORD GradientColor;
  int AnimationId;
};

struct WINDOWCOMPOSITIONATTRIBDATA {
  WINDOWCOMPOSITIONATTRIB Attribute;
  PVOID Data;
  SIZE_T SizeOfData;
};

using SetWindowCompositionAttributeFn = BOOL(WINAPI*)(HWND, WINDOWCOMPOSITIONATTRIBDATA*);

template <typename T>
struct ReleaseCom {
  void operator()(T* value) const {
    if (value) value->Release();
  }
};

template <typename T>
using ComPtr = std::unique_ptr<T, ReleaseCom<T>>;

struct DirectCompositionHost {
  ComPtr<ID3D11Device> d3d_device;
  ComPtr<IDCompositionDevice> device;
  ComPtr<IDCompositionTarget> target;
  ComPtr<IDCompositionVisual> root_visual;
};

struct DragState {
  bool use_custom_drag = false;
  bool use_blur_behind = false;
  bool dragging = false;
  POINT pointer_offset{};
};

bool ApplyBackgroundMaterial(HWND hwnd, bool use_blur_behind) {
  const HMODULE user32 = GetModuleHandleW(L"user32.dll");
  const auto set_window_composition_attribute = reinterpret_cast<SetWindowCompositionAttributeFn>(
    GetProcAddress(user32, "SetWindowCompositionAttribute"));
  if (!set_window_composition_attribute) return false;

  // BlurBehind omits Acrylic's tinted/noise layer while retaining a live
  // desktop blur. Acrylic keeps the faint neutral tint used by the app.
  ACCENT_POLICY policy{
    use_blur_behind ? ACCENT_ENABLE_BLURBEHIND : ACCENT_ENABLE_ACRYLICBLURBEHIND,
    use_blur_behind ? 0 : 0x2,
    use_blur_behind ? 0 : 0x38ECECF0,
    0,
  };
  WINDOWCOMPOSITIONATTRIBDATA data{
    WCA_ACCENT_POLICY,
    &policy,
    sizeof(policy),
  };
  return set_window_composition_attribute(hwnd, &data) == TRUE;
}

bool InitializeDirectComposition(HWND hwnd, DirectCompositionHost* host) {
  if (!host) return false;

  constexpr UINT flags = D3D11_CREATE_DEVICE_BGRA_SUPPORT;
  ID3D11Device* raw_d3d_device = nullptr;
  D3D_FEATURE_LEVEL feature_level{};
  const HRESULT create_device = D3D11CreateDevice(
    nullptr,
    D3D_DRIVER_TYPE_HARDWARE,
    nullptr,
    flags,
    nullptr,
    0,
    D3D11_SDK_VERSION,
    &raw_d3d_device,
    &feature_level,
    nullptr);
  if (FAILED(create_device)) return false;
  host->d3d_device.reset(raw_d3d_device);

  IDXGIDevice* raw_dxgi_device = nullptr;
  if (FAILED(host->d3d_device->QueryInterface(IID_PPV_ARGS(&raw_dxgi_device)))) return false;
  ComPtr<IDXGIDevice> dxgi_device(raw_dxgi_device);

  IDCompositionDevice* raw_composition_device = nullptr;
  if (FAILED(DCompositionCreateDevice(dxgi_device.get(), IID_PPV_ARGS(&raw_composition_device)))) return false;
  host->device.reset(raw_composition_device);

  IDCompositionTarget* raw_target = nullptr;
  if (FAILED(host->device->CreateTargetForHwnd(hwnd, TRUE, &raw_target))) return false;
  host->target.reset(raw_target);

  IDCompositionVisual* raw_root_visual = nullptr;
  if (FAILED(host->device->CreateVisual(&raw_root_visual))) return false;
  host->root_visual.reset(raw_root_visual);

  return SUCCEEDED(host->target->SetRoot(host->root_visual.get()))
    && SUCCEEDED(host->device->Commit());
}

void DrawProbeLabel(HWND hwnd) {
  PAINTSTRUCT paint{};
  HDC dc = BeginPaint(hwnd, &paint);
  SetBkMode(dc, TRANSPARENT);
  SetTextColor(dc, RGB(22, 26, 30));

  RECT title{ 22, 18, 438, 48 };
  HFONT title_font = CreateFontW(
    19, 0, 0, 0, FW_SEMIBOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET,
    OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY,
    DEFAULT_PITCH | FF_SWISS, L"Segoe UI");
  const auto old_font = SelectObject(dc, title_font);
  DrawTextW(dc, L"Native Acrylic / DirectComposition", -1, &title, DT_LEFT | DT_SINGLELINE | DT_VCENTER);
  SelectObject(dc, old_font);
  DeleteObject(title_font);

  SetTextColor(dc, RGB(64, 70, 76));
  RECT body{ 22, 56, 438, 102 };
  DrawTextW(dc, L"Drag anywhere in this window. The desktop should stay live behind the fog.", -1, &body, DT_LEFT | DT_WORDBREAK);
  EndPaint(hwnd, &paint);
}

LRESULT CALLBACK WindowProc(HWND hwnd, UINT message, WPARAM w_param, LPARAM l_param) {
  auto* drag_state = reinterpret_cast<DragState*>(GetWindowLongPtrW(hwnd, GWLP_USERDATA));
  switch (message) {
    case WM_NCHITTEST:
      return drag_state && drag_state->use_custom_drag ? HTCLIENT : HTCAPTION;
    case WM_LBUTTONDOWN:
      if (drag_state && drag_state->use_custom_drag) {
        RECT bounds{};
        POINT pointer{ GET_X_LPARAM(l_param), GET_Y_LPARAM(l_param) };
        GetWindowRect(hwnd, &bounds);
        drag_state->pointer_offset = pointer;
        drag_state->dragging = SetCapture(hwnd) == hwnd;
      }
      return 0;
    case WM_MOUSEMOVE:
      if (drag_state && drag_state->dragging && (w_param & MK_LBUTTON)) {
        POINT pointer{ GET_X_LPARAM(l_param), GET_Y_LPARAM(l_param) };
        ClientToScreen(hwnd, &pointer);
        SetWindowPos(hwnd, HWND_TOP, pointer.x - drag_state->pointer_offset.x,
          pointer.y - drag_state->pointer_offset.y, 0, 0, SWP_NOSIZE | SWP_NOACTIVATE);
      }
      return 0;
    case WM_LBUTTONUP:
    case WM_CAPTURECHANGED:
      if (drag_state && drag_state->dragging) {
        drag_state->dragging = false;
        ReleaseCapture();
      }
      return 0;
    case WM_ERASEBKGND:
      return 1;
    case WM_PAINT:
      DrawProbeLabel(hwnd);
      return 0;
    case WM_KEYDOWN:
      if (w_param == VK_ESCAPE) DestroyWindow(hwnd);
      return 0;
    case WM_CLOSE:
      DestroyWindow(hwnd);
      return 0;
    case WM_DESTROY:
      PostQuitMessage(0);
      return 0;
    default:
      return DefWindowProcW(hwnd, message, w_param, l_param);
  }
}

}  // namespace

int WINAPI wWinMain(HINSTANCE instance, HINSTANCE, PWSTR command_line, int show_command) {
  const WNDCLASSW window_class{
    .lpfnWndProc = WindowProc,
    .hInstance = instance,
    .hCursor = LoadCursorW(nullptr, MAKEINTRESOURCEW(32646)),
    .lpszClassName = kWindowClassName,
  };
  if (!RegisterClassW(&window_class) && GetLastError() != ERROR_CLASS_ALREADY_EXISTS) return 1;

  DragState drag_state{
    .use_custom_drag = wcsstr(command_line, L"--custom-drag") != nullptr,
    .use_blur_behind = wcsstr(command_line, L"--blur-behind") != nullptr,
  };
  HWND hwnd = CreateWindowExW(
    WS_EX_NOREDIRECTIONBITMAP,
    kWindowClassName,
    kWindowTitle,
    WS_POPUP,
    260,
    180,
    460,
    132,
    nullptr,
    nullptr,
    instance,
    &drag_state);
  if (!hwnd) return 2;

  SetWindowLongPtrW(hwnd, GWLP_USERDATA, reinterpret_cast<LONG_PTR>(&drag_state));

  DirectCompositionHost composition;
  if (!InitializeDirectComposition(hwnd, &composition)) return 3;
  if (!ApplyBackgroundMaterial(hwnd, drag_state.use_blur_behind)) return 4;

  ShowWindow(hwnd, show_command);
  UpdateWindow(hwnd);

  MSG message{};
  while (GetMessageW(&message, nullptr, 0, 0) > 0) {
    TranslateMessage(&message);
    DispatchMessageW(&message);
  }
  return static_cast<int>(message.wParam);
}
