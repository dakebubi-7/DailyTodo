"use strict";
const electron = require("electron");
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const Store = require("electron-store");
function getDateKey$1(value = (/* @__PURE__ */ new Date()).toISOString()) {
  return value.slice(0, 10);
}
function getTimeKey(value = (/* @__PURE__ */ new Date()).toISOString()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}
function renderTemplate$1(template, item) {
  const replacements = {
    date: getDateKey$1(item.createdAt),
    time: getTimeKey(item.createdAt),
    content: item.content,
    tags: item.tags.map((tag) => tag.startsWith("#") ? tag : `#${tag}`).join(" "),
    priority: item.priority || "",
    source: item.source,
    status: item.status,
    createdAt: item.createdAt
  };
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => replacements[key] ?? "");
}
function matchesRule(item, rule) {
  if (!rule.enabled) return false;
  const condition = rule.when;
  if (condition.type && item.type !== condition.type) return false;
  if (condition.priority && item.priority !== condition.priority) return false;
  if (condition.source && item.source !== condition.source) return false;
  if (condition.tagsAny?.length) {
    const tags = new Set(item.tags.map((tag) => tag.replace(/^#/, "").toLowerCase()));
    if (!condition.tagsAny.some((tag) => tags.has(tag.replace(/^#/, "").toLowerCase()))) return false;
  }
  if (condition.tagsAll?.length) {
    const tags = new Set(item.tags.map((tag) => tag.replace(/^#/, "").toLowerCase()));
    if (!condition.tagsAll.every((tag) => tags.has(tag.replace(/^#/, "").toLowerCase()))) return false;
  }
  if (condition.containsAny?.length) {
    const content = item.content.toLowerCase();
    if (!condition.containsAny.some((keyword) => content.includes(keyword.toLowerCase()))) return false;
  }
  return true;
}
function resolveTargetPath(vaultPath, target, item) {
  const rendered = renderTemplate$1(target, item).replace(/[<>:"|?*]/g, "-");
  if (path.isAbsolute(rendered)) {
    throw new Error(`Target path must be relative to the vault: ${rendered}`);
  }
  const vaultRoot = path.resolve(vaultPath);
  const resolved = path.resolve(vaultRoot, rendered);
  const relative = path.relative(vaultRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Target path escapes the selected vault: ${rendered}`);
  }
  return resolved;
}
function buildSyncPlan(settings, items) {
  const errors = [];
  const changes = [];
  const unmatchedItems = [];
  const templates = new Map(settings.templates.map((template) => [template.id, template]));
  const rules = [...settings.rules].sort((a, b) => b.priority - a.priority);
  if (!settings.vaultPath) {
    return { ok: false, changes: [], unmatchedItems: items, errors: ["Obsidian vault path is missing."] };
  }
  for (const item of items) {
    let matched = false;
    for (const rule of rules) {
      if (!matchesRule(item, rule)) continue;
      matched = true;
      const template = templates.get(rule.write.templateId);
      if (!template) {
        errors.push(`Rule "${rule.name}" references missing template "${rule.write.templateId}".`);
        continue;
      }
      try {
        const filePath = resolveTargetPath(settings.vaultPath, rule.write.target, item);
        changes.push({
          filePath,
          action: fs.existsSync(filePath) ? "update-file" : "create-file",
          section: rule.write.section,
          mode: rule.write.mode,
          content: renderTemplate$1(template.body, item),
          itemIds: [item.id],
          ruleId: rule.id
        });
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
      if (rule.afterMatch === "stop") break;
    }
    if (!matched) unmatchedItems.push(item);
  }
  return { ok: errors.length === 0, changes, unmatchedItems, errors };
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function insertIntoSection(existing, section, content) {
  if (!section) return `${existing.trimEnd()}
${content}
`;
  const headingMatch = section.match(/^(#{1,6})\s+(.+)$/);
  if (!headingMatch) {
    return `${existing.trimEnd()}

${section}
${content}
`;
  }
  const headingLevel = headingMatch[1].length;
  const headingPattern = new RegExp(`^${escapeRegExp(section)}\\s*$`, "m");
  const match = headingPattern.exec(existing);
  if (!match) {
    return `${existing.trimEnd()}

${section}
${content}
`;
  }
  const afterHeading = match.index + match[0].length;
  const rest = existing.slice(afterHeading);
  const nextHeadingPattern = new RegExp(`\\n#{1,${headingLevel}}\\s+`, "m");
  const nextHeadingMatch = nextHeadingPattern.exec(rest);
  const insertAt = nextHeadingMatch ? afterHeading + nextHeadingMatch.index : existing.length;
  const before = existing.slice(0, insertAt).trimEnd();
  const after = existing.slice(insertAt);
  return before + "\n" + content + (after.startsWith("\n") ? after : "\n" + after);
}
function replaceManagedBlock$1(existing, ruleId, content) {
  const start = `<!-- DAILYTODO:START ${ruleId} -->`;
  const end = `<!-- DAILYTODO:END ${ruleId} -->`;
  const block = `${start}
${content}
${end}`;
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  return pattern.test(existing) ? existing.replace(pattern, block) : `${existing.trimEnd()}

${block}
`;
}
function writeSyncPlan(plan) {
  if (!plan.ok) return { ok: false, errors: plan.errors };
  const errors = [];
  for (const change of plan.changes) {
    try {
      fs.mkdirSync(path.dirname(change.filePath), { recursive: true });
      const existing = fs.existsSync(change.filePath) ? fs.readFileSync(change.filePath, "utf-8") : "";
      const next = change.mode === "managed-block" ? replaceManagedBlock$1(existing, change.ruleId, change.content) : insertIntoSection(existing, change.section, change.content);
      fs.writeFileSync(change.filePath, next, "utf-8");
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  return { ok: errors.length === 0, errors };
}
function getUniqueDestination(directory, fileName) {
  const parsed = path.parse(fileName);
  let candidate = path.join(directory, fileName);
  let index = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(directory, `${parsed.name}-${Date.now()}-${index}${parsed.ext}`);
    index += 1;
  }
  return candidate;
}
function normalizeCaptureType(value) {
  return value === "task" || value === "work" || value === "note" || value === "inspiration" ? value : "inspiration";
}
function importMobileInbox(inboxPath) {
  if (!inboxPath || !fs.existsSync(inboxPath)) {
    return { ok: false, items: [], errors: ["Mobile inbox path does not exist."] };
  }
  const processed = path.join(inboxPath, "_processed");
  const failed = path.join(inboxPath, "_failed");
  fs.mkdirSync(processed, { recursive: true });
  fs.mkdirSync(failed, { recursive: true });
  const items = [];
  const errors = [];
  const files = fs.readdirSync(inboxPath).filter((name) => [".md", ".txt", ".json"].includes(path.extname(name).toLowerCase()));
  for (const file of files) {
    const filePath = path.join(inboxPath, file);
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const ext = path.extname(file).toLowerCase();
      const parsed = ext === ".json" ? JSON.parse(raw) : { content: raw, type: "inspiration", tags: [] };
      items.push({
        id: `mobile-${Date.now()}-${items.length}`,
        type: normalizeCaptureType(parsed.type),
        content: String(parsed.content || raw).trim(),
        tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
        priority: parsed.priority === "high" || parsed.priority === "medium" || parsed.priority === "low" ? parsed.priority : void 0,
        source: "mobile-inbox",
        status: "new",
        createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : (/* @__PURE__ */ new Date()).toISOString(),
        metadata: { fileName: file }
      });
      fs.renameSync(filePath, getUniqueDestination(processed, file));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      fs.renameSync(filePath, getUniqueDestination(failed, file));
    }
  }
  return { ok: errors.length === 0, items, errors };
}
const APP_SETTINGS_KEY = "appBehaviorSettings";
const OBSIDIAN_TEMPLATE_SETTINGS_KEY = "obsidianTemplateSettings";
function createDefaultAppSettings() {
  return {
    language: "zh-CN",
    rolloverTime: "05:00",
    autoCarryForward: true,
    syncDeletedReviewsToObsidian: true,
    confirmBeforeDeletingReview: false,
    lockWindowPosition: false
  };
}
function createDefaultObsidianTemplateSettings() {
  return {
    dailyNotePath: "logs/daily/DailyTodo/{{date}}.md",
    taskExportPath: "logs/daily/DailyTodo/tasks/{{date}}.md",
    workSectionTitle: "今日工作",
    inspirationSectionTitle: "灵感闪念",
    taskSectionTitle: "每日任务",
    reviewSectionTitle: "复盘",
    tomorrowTaskSectionTitle: "明日待办",
    reusableKnowledgeSectionTitle: "可复用知识",
    taskLineTemplate: "- [{{checked}}] {{text}} #{{priority}}{{dateNote}}",
    completionReviewTemplate: [
      "  - 阶段记录 {{index}}：{{status}}，完成度 {{percent}}%，记录时间 {{reviewedAt}}",
      "    - 今天情况：{{summary}}",
      "    - 还没懂/卡点：{{unknowns}}",
      "    - 下一步：{{nextStep}}"
    ].join("\n")
  };
}
function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
function isLanguage(value) {
  return value === "zh-CN" || value === "en-US";
}
function isTime(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
function text(value, fallback) {
  return typeof value === "string" && value.trim() ? value : fallback;
}
function normalizeAppSettings(value) {
  const defaults = createDefaultAppSettings();
  if (!isObject(value)) return defaults;
  return {
    language: isLanguage(value.language) ? value.language : defaults.language,
    rolloverTime: isTime(value.rolloverTime) ? value.rolloverTime : defaults.rolloverTime,
    autoCarryForward: typeof value.autoCarryForward === "boolean" ? value.autoCarryForward : defaults.autoCarryForward,
    syncDeletedReviewsToObsidian: typeof value.syncDeletedReviewsToObsidian === "boolean" ? value.syncDeletedReviewsToObsidian : defaults.syncDeletedReviewsToObsidian,
    confirmBeforeDeletingReview: typeof value.confirmBeforeDeletingReview === "boolean" ? value.confirmBeforeDeletingReview : defaults.confirmBeforeDeletingReview,
    lockWindowPosition: typeof value.lockWindowPosition === "boolean" ? value.lockWindowPosition : defaults.lockWindowPosition
  };
}
function normalizeObsidianTemplateSettings(value) {
  const defaults = createDefaultObsidianTemplateSettings();
  if (!isObject(value)) return defaults;
  return {
    dailyNotePath: text(value.dailyNotePath, defaults.dailyNotePath),
    taskExportPath: text(value.taskExportPath, defaults.taskExportPath),
    workSectionTitle: text(value.workSectionTitle, defaults.workSectionTitle),
    inspirationSectionTitle: text(value.inspirationSectionTitle, defaults.inspirationSectionTitle),
    taskSectionTitle: text(value.taskSectionTitle, defaults.taskSectionTitle),
    reviewSectionTitle: text(value.reviewSectionTitle, defaults.reviewSectionTitle),
    tomorrowTaskSectionTitle: text(value.tomorrowTaskSectionTitle, defaults.tomorrowTaskSectionTitle),
    reusableKnowledgeSectionTitle: text(value.reusableKnowledgeSectionTitle, defaults.reusableKnowledgeSectionTitle),
    taskLineTemplate: text(value.taskLineTemplate, defaults.taskLineTemplate),
    completionReviewTemplate: text(value.completionReviewTemplate, defaults.completionReviewTemplate)
  };
}
const TASK_START_MARKER = "<!-- DAILYTODO:TASKS:START -->";
const TASK_END_MARKER = "<!-- DAILYTODO:TASKS:END -->";
const WORK_START_MARKER = "<!-- DAILYTODO:WORK:START -->";
const WORK_END_MARKER = "<!-- DAILYTODO:WORK:END -->";
const INSPIRATION_START_MARKER = "<!-- DAILYTODO:INSPIRATION:START -->";
const INSPIRATION_END_MARKER = "<!-- DAILYTODO:INSPIRATION:END -->";
function renderPath(template, date) {
  return template.replace(/\{\{date\}\}/g, date);
}
function resolveTemplatePath(vaultPath, templatePath, date) {
  const rendered = renderPath(templatePath, date).replace(/[<>:"|?*]/g, "-");
  if (path.isAbsolute(rendered)) {
    throw new Error(`Template path must be relative to the vault: ${rendered}`);
  }
  const vaultRoot = path.resolve(vaultPath);
  const resolved = path.resolve(vaultRoot, rendered);
  const relative = path.relative(vaultRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Template path escapes the selected vault: ${rendered}`);
  }
  return resolved;
}
function getTaskDate$1(task) {
  return task.taskDate || task.createdAt?.slice(0, 10) || "";
}
function escapeTaskText(text2 = "") {
  return text2.replace(/\r?\n/g, " ").trim();
}
function escapeReviewText(text2 = "") {
  const trimmed = text2.trim();
  if (!trimmed) return "";
  return trimmed.replace(/\r?\n/g, "\n      ");
}
function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN");
}
function getReviewDate$1(review) {
  return review.reviewedAt.slice(0, 10);
}
function getCompletionReviews$1(task) {
  if (task.completionReviews?.length) return task.completionReviews;
  return task.completionReview ? [task.completionReview] : [];
}
function renderTemplate(template, replacements) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(replacements[key] ?? ""));
}
function buildTaskLines$1(tasks, date, templates) {
  const priorityLabel = { high: "高", medium: "中", low: "低" };
  const statusLabel = { done: "全部完成", partial: "部分完成", blocked: "有卡点" };
  return tasks.filter((task) => getTaskDate$1(task) === date || getCompletionReviews$1(task).some((review) => getReviewDate$1(review) === date)).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  }).flatMap((task) => {
    const taskDate = getTaskDate$1(task);
    const lines = [
      renderTemplate(templates.taskLineTemplate, {
        checked: task.completed ? "x" : " ",
        text: escapeTaskText(task.text),
        priority: priorityLabel[task.priority],
        dateNote: taskDate && taskDate !== date ? ` (任务日期：${taskDate})` : ""
      })
    ];
    if (task.completedAt) {
      lines.push(`  - 任务完成时间：${formatDateTime(task.completedAt)}`);
    }
    const visibleReviews = taskDate === date ? getCompletionReviews$1(task) : getCompletionReviews$1(task).filter((review) => getReviewDate$1(review) === date);
    visibleReviews.forEach((review, index) => {
      const rawDetails = {
        summary: review.summary,
        unknowns: review.unknowns,
        nextStep: review.nextStep
      };
      const replacements = {
        index: index + 1,
        status: statusLabel[review.status],
        percent: review.percent,
        reviewedAt: formatDateTime(review.reviewedAt),
        summary: escapeReviewText(review.summary),
        unknowns: escapeReviewText(review.unknowns),
        nextStep: escapeReviewText(review.nextStep)
      };
      const renderedLines = templates.completionReviewTemplate.split("\n").filter((lineTemplate) => {
        const referenced = Object.keys(rawDetails).filter((token) => lineTemplate.includes(`{{${token}}}`));
        if (!referenced.length) return true;
        return referenced.some((token) => escapeTaskText(rawDetails[token]) !== "");
      }).map((lineTemplate) => renderTemplate(lineTemplate, replacements));
      if (renderedLines.length) {
        lines.push(renderedLines.join("\n"));
      }
    });
    return lines;
  });
}
function buildWorkBlock$1(dailyWork, templates) {
  return [
    WORK_START_MARKER,
    `## ${templates.workSectionTitle}`,
    dailyWork.trim() || "-",
    WORK_END_MARKER
  ].join("\n");
}
function buildInspirationBlock$1(dailyInspiration, templates) {
  return [
    INSPIRATION_START_MARKER,
    `## ${templates.inspirationSectionTitle}`,
    dailyInspiration.trim() || "-",
    INSPIRATION_END_MARKER
  ].join("\n");
}
function buildTaskBlock$1(date, tasks, templates) {
  const taskLines = buildTaskLines$1(tasks, date, templates);
  return [
    TASK_START_MARKER,
    `## ${templates.taskSectionTitle}`,
    taskLines.length ? taskLines.join("\n") : "- [ ] 今天还没有记录任务",
    "",
    `同步时间：${(/* @__PURE__ */ new Date()).toLocaleString("zh-CN")}`,
    TASK_END_MARKER
  ].join("\n");
}
function buildDailyNoteContent(params) {
  const { date, tasks, dailyWork, dailyInspiration, templates } = params;
  return [
    "---",
    `title: "DailyTodo ${date}"`,
    `date: "${date}"`,
    "tags: [daily-todo, daily-review, knowledge-base]",
    "---",
    "",
    `# ${date} 每日记录`,
    "",
    buildWorkBlock$1(dailyWork, templates),
    "",
    buildInspirationBlock$1(dailyInspiration, templates),
    "",
    buildTaskBlock$1(date, tasks, templates),
    "",
    `## ${templates.reviewSectionTitle}`,
    "- 今天最值得保留的经验：",
    "- 可以改进的地方：",
    "",
    `## ${templates.tomorrowTaskSectionTitle}`,
    "- [ ] ",
    "",
    `## ${templates.reusableKnowledgeSectionTitle}`,
    "- 从每日任务、工作记录和灵感闪念中提炼可复用经验。",
    "- 后续可以把稳定结论拆到主题笔记，并在这里保留日期索引。",
    ""
  ].join("\n");
}
function replaceManagedBlock(existing, startMarker, endMarker, block) {
  const start = existing.indexOf(startMarker);
  const end = existing.indexOf(endMarker);
  if (start !== -1 && end !== -1 && end > start) {
    const before = existing.slice(0, start).trimEnd();
    const after = existing.slice(end + endMarker.length).trimStart();
    return [before, block, after].filter(Boolean).join("\n\n") + "\n";
  }
  return `${existing.trimEnd()}

${block}
`;
}
function readMarkedBlockBody$1(existing, startMarker, endMarker) {
  const start = existing.indexOf(startMarker);
  const end = existing.indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) return "";
  const body = existing.slice(start + startMarker.length, end).trim();
  const lines = body.split(/\r?\n/);
  if (lines[0]?.trim().startsWith("## ")) lines.shift();
  const content = lines.join("\n").trim();
  return content === "-" ? "" : content;
}
function countCompletionRecords(tasks) {
  return tasks.reduce((total, task) => total + getCompletionReviews$1(task).length, 0);
}
function reviewKeys(tasks) {
  return new Set(
    tasks.flatMap(
      (task) => getCompletionReviews$1(task).map((review) => `${task.id}:${review.id || review.reviewedAt}`)
    )
  );
}
function buildSyncPreview(params) {
  const existingDailyNote = params.existingDailyNote || "";
  const beforeReviewKeys = reviewKeys(params.tasksBeforeDelete || params.tasksAfterDelete);
  const afterReviewKeys = reviewKeys(params.tasksAfterDelete);
  const deletedReviewWillDisappear = [...beforeReviewKeys].some((key) => !afterReviewKeys.has(key));
  const dailyPath = resolveTemplatePath(params.vaultPath, params.templates.dailyNotePath, params.date);
  return {
    files: [
      { filePath: dailyPath, action: existingDailyNote ? "update" : "create" }
    ],
    managedBlocks: [
      { marker: "DAILYTODO:WORK", action: existingDailyNote.includes(WORK_START_MARKER) ? "replace" : "insert" },
      { marker: "DAILYTODO:INSPIRATION", action: existingDailyNote.includes(INSPIRATION_START_MARKER) ? "replace" : "insert" },
      { marker: "DAILYTODO:TASKS", action: existingDailyNote.includes(TASK_START_MARKER) ? "replace" : "insert" }
    ],
    taskCount: params.tasksAfterDelete.filter((task) => getTaskDate$1(task) === params.date).length,
    completionRecordCount: countCompletionRecords(params.tasksAfterDelete),
    deletedReviewWillDisappear
  };
}
const DEFAULT_COMPANION_TEMPLATES = [
  {
    id: "daily-task-line",
    name: "Daily task line",
    body: "- [ ] {{content}} {{tags}}"
  },
  {
    id: "daily-inspiration-line",
    name: "Daily inspiration line",
    body: "- {{time}} {{content}} {{tags}}"
  },
  {
    id: "daily-work-block",
    name: "Daily work block",
    body: "{{content}}"
  }
];
const DEFAULT_COMPANION_RULES = [
  {
    id: "tasks-to-daily-note",
    name: "Tasks to daily note",
    enabled: true,
    priority: 100,
    when: { type: "task" },
    write: {
      target: "logs/daily/DailyTodo/{{date}}.md",
      section: "## Daily Tasks",
      templateId: "daily-task-line",
      mode: "append"
    },
    afterMatch: "continue"
  },
  {
    id: "inspiration-to-daily-note",
    name: "Inspiration to daily note",
    enabled: true,
    priority: 90,
    when: { type: "inspiration" },
    write: {
      target: "logs/daily/DailyTodo/{{date}}.md",
      section: "## Inspiration",
      templateId: "daily-inspiration-line",
      mode: "append"
    },
    afterMatch: "continue"
  },
  {
    id: "work-to-daily-note",
    name: "Work notes to daily note",
    enabled: true,
    priority: 80,
    when: { type: "work" },
    write: {
      target: "logs/daily/DailyTodo/{{date}}.md",
      section: "## Work Notes",
      templateId: "daily-work-block",
      mode: "managed-block"
    },
    afterMatch: "continue"
  }
];
function createDefaultCompanionSettings(vaultPath = "") {
  return {
    vaultPath,
    mobileInboxPath: "",
    presetId: "minimal-daily-notes",
    syncMode: "manual",
    previewBeforeWrite: true,
    rules: DEFAULT_COMPANION_RULES,
    templates: DEFAULT_COMPANION_TEMPLATES
  };
}
const WINDOW_MODE_KEY = "windowMode";
const LEGACY_ALWAYS_ON_TOP_KEY = "alwaysOnTop";
const DEFAULT_WINDOW_MODE = "onTop";
function isWindowMode(value) {
  return value === "normal" || value === "onTop" || value === "desktop";
}
function resolveWindowMode(storedMode, legacyAlwaysOnTop) {
  if (isWindowMode(storedMode)) return storedMode;
  if (typeof legacyAlwaysOnTop === "boolean") return legacyAlwaysOnTop ? "onTop" : "normal";
  return DEFAULT_WINDOW_MODE;
}
function isAlwaysOnTop(mode) {
  return mode === "onTop";
}
function needsDesktopGuard(mode) {
  return mode === "desktop";
}
function togglePinnedMode(current) {
  return current === "onTop" ? "normal" : "onTop";
}
function setDesktopMode(current, pinnedToDesktop) {
  if (pinnedToDesktop) return "desktop";
  return current === "desktop" ? "normal" : current;
}
electron.app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");
const DEV_APPDATA_ROOT = "G:\\Personal-AI\\DailyTodo\\data";
const DEV_OBSIDIAN_PATH = "G:\\Personal-AI\\Personal-KB";
const LOCAL_BLOG_DRAFT_DIR = "C:\\Users\\25788\\blog\\content\\posts";
function isDevelopmentBuild() {
  return !electron.app.isPackaged;
}
try {
  if (isDevelopmentBuild() && fs.existsSync(DEV_APPDATA_ROOT)) {
    electron.app.setPath("userData", DEV_APPDATA_ROOT);
  }
} catch {
}
function getStoreConfigPath() {
  try {
    return path.join(electron.app.getPath("userData"), "config.json");
  } catch {
    return path.join(process.env.APPDATA || "", "daily-todo", "config.json");
  }
}
function createSafeStore() {
  try {
    return new Store();
  } catch (error) {
    const configPath = getStoreConfigPath();
    if (configPath && fs.existsSync(configPath)) {
      const backupPath = path.join(
        path.dirname(configPath),
        `config.corrupt-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.json`
      );
      fs.copyFileSync(configPath, backupPath);
      fs.writeFileSync(configPath, "{}", "utf-8");
    }
    return new Store();
  }
}
const store = createSafeStore();
const OBSIDIAN_PATH_KEY = "obsidianVaultPath";
const COMPANION_SETTINGS_KEY = "obsidianCompanionSettings";
const WINDOW_STATE_KEY = "windowState";
const COMPACT_MODE_KEY = "compactMode";
const AUTO_START_KEY = "autoStart";
const MIN_WINDOW_WIDTH = 240;
const DEFAULT_WINDOW_WIDTH = 240;
const DEFAULT_WINDOW_HEIGHT = 480;
const RESET_WINDOW_WIDTH = 240;
const RESET_WINDOW_HEIGHT = 480;
const APP_ICON_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABiklEQVR4nO3bQRKCMAwFUM7BHbgCB0Dv4PW8ijdx6ca1rpxhFCFpkv6kDTPZgc1/QumCDgPxmJb5FamouZoLrgaBbhwKgW4WioBuEoqAbg6KgG4KjoBuCAqAbgaOgG4ECoBuAl3qAM/H3bRcA1iHt0BQA6gVXhtBBaB2eE0EMQAqvBZCAiRAAiSAGcC0zBetSoAECAjQ/RyQAAmQAOoBQwFMy3wqrb1wXQBQx2wVgDymawCrSa1rgFCToHX4pgBKx2kCQDJGeADpGO4AtJvXAKwGwAmhdXeFAOCcRwl/u543yzXA+tzS8P+CSyCqAkj+eWp4LoL5JFg7/DiOLAST1yAy/KeoCGbrgNoA6/AuADgIVuEpCOYrQcn1R8/4Vnh3ANwF0h7Ad0hKeBcAWwiUa45udUp4cwAOArcoz/tR+CoAVgilkx4EAIUgXRG6/1CSsxByAWBRVuGnSN8Lm4WPAsBBoP5e2D0D0uA/4aMBaFTX+4a63jm2G751BFL4VhFY4VuCKA4eHYKa6w3BqOZexsuoaQAAAABJRU5ErkJggg==";
function resolveIconPath(fileName) {
  const candidates = isDevelopmentBuild() ? [path.join(__dirname, "..", "build", fileName)] : [path.join(process.resourcesPath, fileName)];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return "";
}
function createAppIcon() {
  const iconPath = resolveIconPath("icon.png");
  if (iconPath) {
    const image = electron.nativeImage.createFromPath(iconPath);
    if (!image.isEmpty()) return image;
  }
  return electron.nativeImage.createFromBuffer(Buffer.from(APP_ICON_PNG_BASE64, "base64"));
}
function createTrayIcon() {
  const iconPath = resolveIconPath("tray.png");
  if (iconPath) {
    const image = electron.nativeImage.createFromPath(iconPath);
    if (!image.isEmpty()) return image.resize({ width: 16, height: 16 });
  }
  return electron.nativeImage.createFromBuffer(Buffer.from(APP_ICON_PNG_BASE64, "base64")).resize({ width: 16, height: 16 });
}
let mainWindow = null;
let tray = null;
let persistTimer = null;
let isQuitting = false;
let windowMode = "onTop";
const DIAG_LOG = (() => {
  try {
    return path.join(electron.app.getPath("userData"), "diag.log");
  } catch {
    return path.join(process.env.APPDATA || process.cwd(), "daily-todo-diag.log");
  }
})();
function diag(message) {
  try {
    fs.appendFileSync(DIAG_LOG, `[${(/* @__PURE__ */ new Date()).toISOString()}] ${message}
`, "utf-8");
  } catch {
  }
}
try {
  electron.crashReporter.start({ submitURL: "", uploadToServer: false, compress: false });
} catch (error) {
  diag(`crashReporter.start failed: ${String(error)}`);
}
process.on("uncaughtException", (error) => {
  diag(`uncaughtException: ${error?.stack || String(error)}`);
});
process.on("unhandledRejection", (reason) => {
  diag(`unhandledRejection: ${String(reason)}`);
});
diag("=== app starting ===");
const GWL_EXSTYLE = -20;
const HWND_BOTTOM = 1;
const SWP_NOSIZE = 1;
const SWP_NOMOVE = 2;
const SWP_NOACTIVATE = 16;
let win32 = null;
if (process.platform === "win32") {
  try {
    const koffi = require("koffi");
    const user32 = koffi.load("user32.dll");
    const GetWindowLongPtrW = user32.func("intptr_t __stdcall GetWindowLongPtrW(void* hWnd, int nIndex)");
    const SetWindowLongPtrW = user32.func("intptr_t __stdcall SetWindowLongPtrW(void* hWnd, int nIndex, intptr_t dwNewLong)");
    const GetForegroundWindow = user32.func("void* __stdcall GetForegroundWindow()");
    const GetClassNameW = user32.func("int __stdcall GetClassNameW(void* hWnd, uint16_t* lpClassName, int nMaxCount)");
    const SetWindowPos = user32.func("bool __stdcall SetWindowPos(void* hWnd, void* hWndInsertAfter, int X, int Y, int cx, int cy, uint32_t uFlags)");
    win32 = {
      ptr: (handle) => koffi.as(handle, "void*"),
      getExStyle: (hwnd) => Number(GetWindowLongPtrW(hwnd, GWL_EXSTYLE)),
      setExStyle: (hwnd, style) => {
        SetWindowLongPtrW(hwnd, GWL_EXSTYLE, style);
      },
      getForegroundClass: () => {
        try {
          const hwnd = GetForegroundWindow();
          if (!hwnd) return "";
          const buf = Buffer.alloc(256 * 2);
          const len = GetClassNameW(hwnd, buf, 256);
          return len > 0 ? buf.toString("utf16le", 0, len * 2) : "";
        } catch {
          return "";
        }
      },
      sendToBottom: (handle) => {
        const hwnd = koffi.as(handle, "void*");
        SetWindowPos(hwnd, koffi.as(HWND_BOTTOM, "void*"), 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
      }
    };
    diag("koffi user32 bound ok");
  } catch (error) {
    win32 = null;
    diag(`koffi bind failed: ${String(error)}`);
  }
}
function isDesktopForeground() {
  if (!win32) return false;
  const cls = win32.getForegroundClass();
  return cls === "WorkerW" || cls === "Progman";
}
const gotLock = electron.app.requestSingleInstanceLock();
diag(`singleInstanceLock gotLock=${gotLock}`);
if (!gotLock) {
  diag("duplicate instance → quit");
  electron.app.quit();
} else {
  electron.app.on("second-instance", () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
}
function zh(text2) {
  return text2;
}
function getTodayDate() {
  const today = /* @__PURE__ */ new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function getDateKey(date) {
  return (date || getTodayDate()).slice(0, 10);
}
function getTaskDate(task) {
  return task.taskDate || task.createdAt?.slice(0, 10) || getTodayDate();
}
function getReviewDate(review) {
  return getDateKey(review.reviewedAt);
}
function getCompletionReviews(task) {
  if (task.completionReviews?.length) return task.completionReviews;
  return task.completionReview ? [task.completionReview] : [];
}
function getDefaultVaultPath() {
  return isDevelopmentBuild() && fs.existsSync(DEV_OBSIDIAN_PATH) ? DEV_OBSIDIAN_PATH : "";
}
function getVaultPath() {
  return store.get(OBSIDIAN_PATH_KEY) || getDefaultVaultPath();
}
function getVaultStatus() {
  const vaultPath = getVaultPath();
  if (!vaultPath) return { ok: false, reason: zh("请先选择 Obsidian 文件夹") };
  if (!fs.existsSync(vaultPath)) {
    return {
      ok: false,
      reason: zh("已记录的 Obsidian 文件夹不存在，请点“更改文件夹”重新选择")
    };
  }
  return { ok: true, vaultPath };
}
function getCompanionSettings() {
  const existing = store.get(COMPANION_SETTINGS_KEY);
  if (existing && typeof existing === "object") return existing;
  return createDefaultCompanionSettings(getVaultPath());
}
function setCompanionSettings(value) {
  store.set(COMPANION_SETTINGS_KEY, value);
}
function getAppSettings() {
  return normalizeAppSettings(store.get(APP_SETTINGS_KEY));
}
function setAppSettings(value) {
  const settings = normalizeAppSettings(value);
  store.set(APP_SETTINGS_KEY, settings);
  return settings;
}
function getObsidianTemplateSettings() {
  return normalizeObsidianTemplateSettings(store.get(OBSIDIAN_TEMPLATE_SETTINGS_KEY));
}
function setObsidianTemplateSettings(value) {
  const settings = normalizeObsidianTemplateSettings(value);
  store.set(OBSIDIAN_TEMPLATE_SETTINGS_KEY, settings);
  return settings;
}
function getDailyFilePath(date) {
  return resolveTemplatePath(getVaultPath(), getObsidianTemplateSettings().dailyNotePath, getDateKey(date));
}
function triggerOverviewUpdate(filePath) {
  try {
    const vaultPath = getVaultPath();
    if (!vaultPath) return;
    const scriptPath = path.join(vaultPath, "tools", "update_daily_overview.py");
    if (!fs.existsSync(scriptPath)) return;
    child_process.spawnSync("python", [scriptPath, "--from-hook"], {
      input: JSON.stringify({ tool_name: "Write", tool_input: { file_path: filePath } }),
      cwd: vaultPath,
      encoding: "utf-8",
      timeout: 1e4,
      windowsHide: true
    });
  } catch {
  }
}
function buildTaskLines(tasks, date, templates = getObsidianTemplateSettings()) {
  const selected = getDateKey(date);
  return buildTaskLines$1(tasks, selected, templates);
}
function buildTaskBlock(date, tasks, templates = getObsidianTemplateSettings()) {
  const selected = getDateKey(date);
  return buildTaskBlock$1(selected, tasks, templates);
}
function buildWorkBlock(dailyWork = "", templates = getObsidianTemplateSettings()) {
  return buildWorkBlock$1(dailyWork, templates);
}
function buildInspirationBlock(inspiration = "", templates = getObsidianTemplateSettings()) {
  return buildInspirationBlock$1(inspiration, templates);
}
function buildDailyTemplate(date, dailyWork = "", inspiration = "", templates = getObsidianTemplateSettings()) {
  const selected = getDateKey(date);
  return buildDailyNoteContent({ date: selected, tasks: [], dailyWork, dailyInspiration: inspiration, templates });
}
function migrateLegacyInspirationSection(existing, inspiration = "") {
  if (existing.includes(INSPIRATION_START_MARKER)) return existing;
  const headings = [`## ${zh("碎碎念")}`, `## ${zh("灵感闪念")}`];
  const match = headings.map((heading) => ({ heading, start: existing.indexOf(heading) })).filter((item) => item.start !== -1).sort((a, b) => a.start - b.start)[0];
  if (!match) return `${existing.trimEnd()}

${buildInspirationBlock(inspiration)}
`;
  const nextHeading = existing.indexOf("\n## ", match.start + match.heading.length);
  const before = existing.slice(0, match.start).trimEnd();
  const legacySection = existing.slice(match.start + match.heading.length, nextHeading === -1 ? void 0 : nextHeading).trim();
  const after = nextHeading === -1 ? "" : existing.slice(nextHeading).trimStart();
  const migratedInspiration = inspiration.trim() || (legacySection === "-" ? "" : legacySection);
  return [before, buildInspirationBlock(migratedInspiration), after].filter(Boolean).join("\n\n") + "\n";
}
function upsertMarkedBlock(existing, startMarker, endMarker, block) {
  return replaceManagedBlock(existing, startMarker, endMarker, block);
}
function readMarkedBlockBody(existing, startMarker, endMarker) {
  return readMarkedBlockBody$1(existing, startMarker, endMarker);
}
function removeUnmarkedWorkSections(existing) {
  const workHeading = `## ${zh("今日工作")}`;
  let content = existing;
  let searchFrom = 0;
  while (true) {
    const start = content.indexOf(workHeading, searchFrom);
    if (start === -1) return content;
    const markerStart = content.lastIndexOf(WORK_START_MARKER, start);
    const markerEnd = content.indexOf(WORK_END_MARKER, start);
    const insideMarkedBlock = markerStart !== -1 && markerEnd !== -1 && markerStart < start && start < markerEnd;
    if (insideMarkedBlock) {
      searchFrom = start + workHeading.length;
      continue;
    }
    const nextHeading = content.indexOf("\n## ", start + workHeading.length);
    const before = content.slice(0, start).trimEnd();
    const after = nextHeading === -1 ? "" : content.slice(nextHeading).trimStart();
    content = [before, after].filter(Boolean).join("\n\n") + "\n";
    searchFrom = before.length;
  }
}
function migrateLegacyWorkSection(existing, dailyWork = "") {
  const workHeading = `## ${zh("今日工作")}`;
  if (existing.includes(WORK_START_MARKER)) return removeUnmarkedWorkSections(existing);
  const start = existing.indexOf(workHeading);
  if (start === -1) return existing;
  const nextHeading = existing.indexOf("\n## ", start + workHeading.length);
  const before = existing.slice(0, start).trimEnd();
  const legacySection = existing.slice(start + workHeading.length, nextHeading === -1 ? void 0 : nextHeading).trim();
  const after = nextHeading === -1 ? "" : existing.slice(nextHeading).trimStart();
  const migratedWork = dailyWork.trim() || (legacySection === "-" ? "" : legacySection);
  return [before, buildWorkBlock(migratedWork), after].filter(Boolean).join("\n\n") + "\n";
}
function buildBlogDraft(date, tasks, obsidianContent = "") {
  const selected = getDateKey(date);
  const taskLines = buildTaskLines(tasks, selected);
  const completed = tasks.filter((task) => getTaskDate(task) === selected && task.completed).length;
  const total = tasks.filter((task) => getTaskDate(task) === selected).length;
  return [
    "---",
    `title: "${selected} ${zh("每日工作与灵感闪念")}"`,
    `date: "${selected}"`,
    `category: "${zh("每日记录")}"`,
    `tags: ["${zh("工作记录")}", "${zh("灵感闪念")}", "DailyTodo"]`,
    `excerpt: "${zh("今日完成")} ${completed}/${total} ${zh("项任务，整理工作进展和灵感片段。")}"`,
    "draft: true",
    "---",
    "",
    `# ${selected} ${zh("每日工作与灵感闪念")}`,
    "",
    `## ${zh("今天做了什么")}`,
    obsidianContent.trim() || zh("今天的工作记录还没有填写。"),
    "",
    `## ${zh("任务回顾")}`,
    taskLines.length ? taskLines.join("\n") : `- ${zh("今天还没有记录任务。")}`,
    "",
    `## ${zh("可以继续沉淀的内容")}`,
    `- ${zh("这里可以在发布前补充更完整的复盘、链接或图片。")}`,
    "",
    `> ${zh("这篇文章由")} DailyTodo ${zh("自动生成草稿，发布前可以把")} \`draft: true\` ${zh("改为")} \`draft: false\`${zh("。")}`,
    ""
  ].join("\n");
}
function syncOneDailyNote(tasks, selected, dailyWork = "", inspiration = "", useProvidedDailySections = false) {
  const templates = getObsidianTemplateSettings();
  const filePath = getDailyFilePath(selected);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : buildDailyTemplate(selected, dailyWork, inspiration, templates);
  const migratedWork = migrateLegacyWorkSection(existing, dailyWork);
  const migratedInspiration = migrateLegacyInspirationSection(migratedWork, inspiration);
  const existingWork = readMarkedBlockBody(migratedInspiration, WORK_START_MARKER, WORK_END_MARKER);
  const existingInspiration = readMarkedBlockBody(migratedInspiration, INSPIRATION_START_MARKER, INSPIRATION_END_MARKER);
  const nextWork = useProvidedDailySections ? dailyWork : existingWork;
  const nextInspiration = useProvidedDailySections ? inspiration.trim() || existingInspiration : existingInspiration;
  const withWork = upsertMarkedBlock(migratedInspiration, WORK_START_MARKER, WORK_END_MARKER, buildWorkBlock(nextWork, templates));
  const withInspiration = upsertMarkedBlock(withWork, INSPIRATION_START_MARKER, INSPIRATION_END_MARKER, buildInspirationBlock(nextInspiration, templates));
  const nextContent = upsertMarkedBlock(withInspiration, TASK_START_MARKER, TASK_END_MARKER, buildTaskBlock(selected, tasks, templates));
  fs.writeFileSync(filePath, nextContent, "utf-8");
  return { filePath, nextContent };
}
function getDatesAffectedBySync(tasks, selected) {
  const dates = /* @__PURE__ */ new Set([selected]);
  tasks.forEach((task) => {
    const taskDate = getTaskDate(task);
    const hasRecordOnSelected = getCompletionReviews(task).some((review) => getReviewDate(review) === selected);
    if (taskDate === selected || hasRecordOnSelected) {
      dates.add(taskDate);
    }
  });
  return Array.from(dates);
}
function syncTasksToObsidian(tasks, date, dailyWork = "", inspiration = "") {
  const vaultStatus = getVaultStatus();
  if (!vaultStatus.ok || !vaultStatus.vaultPath) return { ok: false, reason: vaultStatus.reason };
  const selected = getDateKey(date);
  const affectedDates = getDatesAffectedBySync(tasks, selected);
  let selectedResult = syncOneDailyNote(tasks, selected, dailyWork, inspiration, true);
  affectedDates.filter((affectedDate) => affectedDate !== selected).forEach((affectedDate) => {
    syncOneDailyNote(tasks, affectedDate);
  });
  if (fs.existsSync(LOCAL_BLOG_DRAFT_DIR)) {
    fs.writeFileSync(path.join(LOCAL_BLOG_DRAFT_DIR, `daily-memo-${selected}.md`), buildBlogDraft(selected, tasks, selectedResult.nextContent), "utf-8");
  }
  triggerOverviewUpdate(selectedResult.filePath);
  return { ok: true, filePath: selectedResult.filePath };
}
function previewTasksToObsidian(tasks, date, dailyWork = "", inspiration = "", beforeTasks) {
  const vaultStatus = getVaultStatus();
  if (!vaultStatus.ok || !vaultStatus.vaultPath) {
    return {
      files: [],
      managedBlocks: [],
      taskCount: 0,
      completionRecordCount: 0,
      deletedReviewWillDisappear: false,
      error: vaultStatus.reason
    };
  }
  const selected = getDateKey(date);
  const filePath = getDailyFilePath(selected);
  const existingDailyNote = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : "";
  return buildSyncPreview({
    date: selected,
    tasksBeforeDelete: beforeTasks,
    tasksAfterDelete: tasks,
    templates: getObsidianTemplateSettings(),
    vaultPath: vaultStatus.vaultPath,
    existingDailyNote
  });
}
function getInitialBounds() {
  const saved = store.get(WINDOW_STATE_KEY);
  const { workArea } = electron.screen.getPrimaryDisplay();
  const width = Math.max(MIN_WINDOW_WIDTH, saved?.width || DEFAULT_WINDOW_WIDTH);
  const height = saved?.height || DEFAULT_WINDOW_HEIGHT;
  const x = saved?.x ?? workArea.x + workArea.width - width - 30;
  const y = saved?.y ?? workArea.y + 48;
  return { width, height, x, y };
}
function persistWindowState(win) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    if (win.isDestroyed() || win.isMinimized()) return;
    store.set(WINDOW_STATE_KEY, win.getBounds());
  }, 250);
}
function getStoredWindowMode() {
  return resolveWindowMode(store.get(WINDOW_MODE_KEY), store.get(LEGACY_ALWAYS_ON_TOP_KEY));
}
let desktopGuardTimer = null;
let desktopGuardTopmost = false;
const DESKTOP_GUARD_INTERVAL_MS = 32;
function applyDesktopTopmost(win) {
  if (win.isDestroyed() || windowMode !== "desktop") return;
  const shouldTop = win.isFocused() || isDesktopForeground();
  if (shouldTop === desktopGuardTopmost) return;
  try {
    if (shouldTop) {
      win.setAlwaysOnTop(true);
    } else {
      win.setAlwaysOnTop(false);
      const handle = win.getNativeWindowHandle();
      if (win32 && handle) win32.sendToBottom(handle);
    }
    desktopGuardTopmost = shouldTop;
    diag(`desktop guard: shouldTop=${shouldTop}`);
  } catch (error) {
    diag(`desktop guard apply failed: ${String(error)}`);
  }
}
function startDesktopGuard(win) {
  stopDesktopGuard();
  desktopGuardTopmost = false;
  applyDesktopTopmost(win);
  desktopGuardTimer = setInterval(() => applyDesktopTopmost(win), DESKTOP_GUARD_INTERVAL_MS);
  diag("desktop guard: poll started");
}
function stopDesktopGuard() {
  if (desktopGuardTimer) {
    clearInterval(desktopGuardTimer);
    desktopGuardTimer = null;
    diag("desktop guard: poll stopped");
  }
}
function applyWindowMode(win, mode) {
  windowMode = mode;
  try {
    win.setSkipTaskbar(mode !== "normal");
    if (mode === "desktop") {
      startDesktopGuard(win);
    } else {
      stopDesktopGuard();
      win.setAlwaysOnTop(isAlwaysOnTop(mode));
    }
    diag(`applyWindowMode mode=${mode} alwaysOnTop=${isAlwaysOnTop(mode)} skipTaskbar=${mode !== "normal"}`);
  } catch (error) {
    diag(`applyWindowMode failed: ${String(error)}`);
  }
}
function setWindowMode(win, mode) {
  store.set(WINDOW_MODE_KEY, mode);
  applyWindowMode(win, mode);
  if (!win.isDestroyed()) {
    win.webContents.send("window:modeChanged", mode);
  }
  if (tray) refreshTrayMenu();
}
function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}
function hideMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.hide();
}
function refreshTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(
    electron.Menu.buildFromTemplate([
      { label: zh("打开 DailyTodo"), click: showMainWindow },
      {
        label: zh("钉在桌面（组件模式）"),
        type: "checkbox",
        checked: windowMode === "desktop",
        click: (menuItem) => {
          if (!mainWindow || mainWindow.isDestroyed()) return;
          setWindowMode(mainWindow, setDesktopMode(windowMode, menuItem.checked));
        }
      },
      { label: zh("隐藏窗口"), click: hideMainWindow },
      { type: "separator" },
      {
        label: zh("退出"),
        click: () => {
          isQuitting = true;
          electron.app.quit();
        }
      }
    ])
  );
}
function createTray() {
  if (tray) return;
  tray = new electron.Tray(createTrayIcon());
  tray.setToolTip("DailyTodo");
  refreshTrayMenu();
  tray.on("click", showMainWindow);
}
function createWindow() {
  if (!store.get(OBSIDIAN_PATH_KEY) && getDefaultVaultPath()) {
    store.set(OBSIDIAN_PATH_KEY, getDefaultVaultPath());
  }
  const bounds = getInitialBounds();
  const initialMode = getStoredWindowMode();
  const win = new electron.BrowserWindow({
    ...bounds,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: 480,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: true,
    skipTaskbar: true,
    resizable: true,
    show: false,
    alwaysOnTop: isAlwaysOnTop(initialMode),
    icon: createAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      // 失焦/被遮挡时不节流渲染，配合关闭 occlusion 一起防止透明窗口静默停绘。
      backgroundThrottling: false
    }
  });
  mainWindow = win;
  diag("BrowserWindow created");
  applyWindowMode(win, initialMode);
  createTray();
  diag("tray created");
  const devServerUrl = process.env.ELECTRON_RENDERER_URL || process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    diag(`loadURL ${devServerUrl}`);
    win.loadURL(devServerUrl);
  } else {
    diag("loadFile dist/index.html");
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  win.once("ready-to-show", () => {
    diag("ready-to-show → show()");
    win.show();
  });
  win.webContents.on("did-finish-load", () => diag("did-finish-load"));
  win.webContents.on("did-fail-load", (_e, code, desc) => diag(`did-fail-load ${code} ${desc}`));
  win.webContents.on("preload-error", (_e, p, err) => diag(`preload-error ${p}: ${String(err)}`));
  win.on("show", () => diag("evt: show"));
  win.on("closed", () => {
    diag("evt: closed");
    stopDesktopGuard();
  });
  win.on("hide", () => diag("evt: hide"));
  win.on("minimize", () => {
    diag("evt: minimize");
    if (!needsDesktopGuard(windowMode) || isQuitting || win.isDestroyed()) return;
    try {
      win.showInactive();
      diag("desktop guard: showInactive after minimize");
    } catch (error) {
      diag(`desktop guard failed: ${String(error)}`);
    }
  });
  win.on("restore", () => diag("evt: restore"));
  win.on("blur", () => diag("evt: blur"));
  win.on("focus", () => diag("evt: focus"));
  win.webContents.on("render-process-gone", (_event, details) => {
    diag(`render-process-gone reason=${details.reason} exitCode=${details.exitCode}`);
  });
  win.on("unresponsive", () => diag("window unresponsive"));
  win.on("move", () => persistWindowState(win));
  win.on("resize", () => persistWindowState(win));
  win.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    hideMainWindow();
  });
  electron.ipcMain.handle("window:minimize", hideMainWindow);
  electron.ipcMain.handle("window:close", hideMainWindow);
  electron.ipcMain.handle("window:getWindowMode", () => windowMode);
  electron.ipcMain.handle("window:setWindowMode", (_event, mode) => {
    setWindowMode(win, mode);
    return windowMode;
  });
  electron.ipcMain.handle("window:getAlwaysOnTop", () => windowMode === "onTop");
  electron.ipcMain.handle("window:toggleAlwaysOnTop", () => {
    setWindowMode(win, togglePinnedMode(windowMode));
    return windowMode === "onTop";
  });
  electron.ipcMain.handle("window:resetPosition", () => {
    const { workArea } = electron.screen.getPrimaryDisplay();
    const bounds2 = {
      width: RESET_WINDOW_WIDTH,
      height: RESET_WINDOW_HEIGHT,
      x: workArea.x + workArea.width - RESET_WINDOW_WIDTH - 30,
      y: workArea.y + 48
    };
    win.setBounds(bounds2);
    persistWindowState(win);
    return bounds2;
  });
  electron.ipcMain.handle("window:getLockWindowPosition", () => getAppSettings().lockWindowPosition);
  electron.ipcMain.handle("window:setLockWindowPosition", (_event, locked) => {
    const next = setAppSettings({ ...getAppSettings(), lockWindowPosition: Boolean(locked) });
    return next.lockWindowPosition;
  });
  electron.ipcMain.handle("window:setCompactMode", (_, compactMode) => {
    store.set(COMPACT_MODE_KEY, compactMode);
  });
  electron.ipcMain.handle("window:getCompactMode", () => {
    return Boolean(store.get(COMPACT_MODE_KEY, false));
  });
  electron.ipcMain.handle("window:getAutoStart", () => {
    return Boolean(store.get(AUTO_START_KEY, false));
  });
  electron.ipcMain.handle("window:setAutoStart", (_, enabled) => {
    store.set(AUTO_START_KEY, enabled);
    electron.app.setLoginItemSettings({
      openAtLogin: enabled,
      path: electron.app.getPath("exe")
    });
    return enabled;
  });
  electron.ipcMain.handle("store:get", (_, key) => store.get(key));
  electron.ipcMain.handle("store:set", (_, key, value) => {
    store.set(key, value);
  });
  electron.ipcMain.handle("settings:getApp", () => getAppSettings());
  electron.ipcMain.handle("settings:setApp", (_event, settings) => {
    setAppSettings(settings);
    return { ok: true };
  });
  electron.ipcMain.handle("settings:getObsidianTemplates", () => getObsidianTemplateSettings());
  electron.ipcMain.handle("settings:setObsidianTemplates", (_event, settings) => {
    setObsidianTemplateSettings(settings);
    return { ok: true };
  });
  electron.ipcMain.handle("settings:resetObsidianTemplates", () => {
    const settings = createDefaultObsidianTemplateSettings();
    store.set(OBSIDIAN_TEMPLATE_SETTINGS_KEY, settings);
    return settings;
  });
  electron.ipcMain.handle("obsidian:getPath", () => store.get(OBSIDIAN_PATH_KEY) || getDefaultVaultPath());
  electron.ipcMain.handle("obsidian:choosePath", async () => {
    const result = await electron.dialog.showOpenDialog(win, {
      title: zh("选择 Obsidian 仓库或用于保存每日任务的文件夹"),
      defaultPath: getVaultPath() || electron.app.getPath("documents"),
      properties: ["openDirectory", "createDirectory"]
    });
    if (result.canceled || !result.filePaths[0]) {
      return store.get(OBSIDIAN_PATH_KEY) || getDefaultVaultPath();
    }
    store.set(OBSIDIAN_PATH_KEY, result.filePaths[0]);
    return result.filePaths[0];
  });
  electron.ipcMain.handle("obsidian:syncTasks", (_, tasks, date, dailyWork, inspiration) => syncTasksToObsidian(tasks, date, dailyWork || "", inspiration || ""));
  electron.ipcMain.handle("obsidian:previewTasks", (_, tasks, date, dailyWork, inspiration, beforeTasks) => previewTasksToObsidian(tasks, date, dailyWork || "", inspiration || "", beforeTasks));
  electron.ipcMain.handle("obsidian:openDailyNote", async (_, date) => {
    const vaultStatus = getVaultStatus();
    if (!vaultStatus.ok || !vaultStatus.vaultPath) return { ok: false, reason: vaultStatus.reason };
    const selected = getDateKey(date);
    const filePath = getDailyFilePath(selected);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, buildDailyTemplate(selected), "utf-8");
    triggerOverviewUpdate(filePath);
    const result = await electron.shell.openPath(filePath);
    return result ? { ok: false, reason: result } : { ok: true, filePath };
  });
  electron.ipcMain.handle("companion:getSettings", () => getCompanionSettings());
  electron.ipcMain.handle("companion:setSettings", (_event, settings) => {
    setCompanionSettings(settings);
    return { ok: true };
  });
  electron.ipcMain.handle("companion:previewSync", (_event, settings, items) => {
    return buildSyncPlan(settings, items || []);
  });
  electron.ipcMain.handle("companion:writeSync", (_event, settings, items) => {
    const plan = buildSyncPlan(settings, items || []);
    return writeSyncPlan(plan);
  });
  electron.ipcMain.handle("companion:importMobileInbox", (_event, inboxPath) => {
    return importMobileInbox(inboxPath);
  });
}
electron.app.whenReady().then(() => {
  diag("whenReady → createWindow");
  createWindow();
  diag("createWindow returned");
}).catch((error) => diag(`whenReady error: ${String(error)}`));
electron.app.on("child-process-gone", (_event, details) => {
  diag(`child-process-gone type=${details.type} reason=${details.reason} exitCode=${details.exitCode}`);
  if (details.type === "GPU") ;
});
electron.app.on("before-quit", () => {
  diag("before-quit");
  isQuitting = true;
});
electron.app.on("will-quit", () => diag("will-quit"));
electron.app.on("quit", (_e, code) => diag(`quit code=${code}`));
electron.app.on("window-all-closed", () => {
  diag("window-all-closed");
  mainWindow = null;
  if (isQuitting && process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
