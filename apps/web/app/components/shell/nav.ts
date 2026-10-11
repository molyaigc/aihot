// Site navigation in one place: the desktop sidebar's sections and the phone tab bar's tabs, the engine's
// and the site's modules'.
import type { ReactNode } from "react";
import { NAV, subjectAfter, withSubject } from "@aihot/site";
import { webModules } from "../../site-modules";
import {
  IconBolt, IconBookmark, IconChart, IconClock, IconDoc, IconFlame, IconGrid, IconHeart, IconHistory, IconList, IconMessage, IconPlug, IconUser,
} from "../icons";

export interface NavItem {
  to: string;
  label: string;
  icon: (p: { size?: number }) => ReactNode;
  /** Match the path exactly (the home page). */
  end?: boolean;
  /** Shows the unread dot while the changelog has news. */
  changelog?: boolean;
  /** Sub-items for collapsible parent entries; parent itself toggles instead of navigating. */
  children?: NavItem[];
}

const SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "",
    items: [
      // 全部：无二级菜单，点击直接进入全量资讯。图标用文档而非列表，避免被误解为可展开。
      { to: "/all", label: "全部", icon: IconDoc, end: true },
    ],
  },
  {
    title: "精选",
    items: [
      {
        to: "/",
        label: "精选",
        icon: IconBolt,
        children: [
          { to: "/hot", label: "今日热点", icon: IconFlame },
          { to: "/top10", label: "转化价值TOP10", icon: IconChart },
          { to: "/daily", label: "行业精选", icon: IconClock },
          { to: "/starred", label: "我的收藏", icon: IconBookmark },
        ],
      },
    ],
  },
  {
    title: "主题",
    items: [
      {
        to: "/topics",
        label: "主题",
        icon: IconGrid,
        children: [
          { to: "/topics", label: "行业版块", icon: IconGrid },
          { to: "/topics?group=opportunity", label: "机会信号", icon: IconBolt },
          { to: "/topics?group=content", label: "内容形态", icon: IconDoc },
          { to: "/topics?group=global", label: "出海实战", icon: IconFlame },
          { to: "/topics?group=vc", label: "创投风向标", icon: IconChart },
        ],
      },
    ],
  },
  {
    title: "更多",
    items: [
      {
        to: "/agent",
        label: "更多",
        icon: IconList,
        children: [
          { to: "/agent", label: "Agent 接入", icon: IconPlug },
          { to: "/about", label: "关于", icon: IconHeart },
          { to: "/changelog", label: "更新日志", icon: IconHistory, changelog: true },
          { to: "/feedback", label: "反馈", icon: IconMessage },
        ],
      },
    ],
  },
];

/** Whether an engine page is a way in from the navigation (site.ts NAV.hidden); a hidden page still opens. */
export const inNav = (to: string) => !(NAV.hidden as readonly string[]).includes(to);

/**
 * The sidebar: the engine's sections with the modules' between 内容 and 更多; a module naming a section
 * that is already there adds to it.
 */
export function sidebar(): Array<{ title: string; items: NavItem[] }> {
  const [content, ...rest] = SECTIONS;
  const more = rest.pop()!;
  const sections = [content!, ...rest].map((s) => ({ ...s, items: s.items.filter((i) => inNav(i.to)) }));
  for (const m of webModules()) {
    if (!m.sidebar) continue;
    const section = sections.find((s) => s.title === m.sidebar!.section);
    if (section) section.items.push(...m.sidebar.items);
    else sections.push({ title: m.sidebar.section, items: [...m.sidebar.items] });
  }
  return [...sections, more];
}

/** A sidebar entry is lit on its pages; 日报 also covers weekly and monthly reports. Parent with children is active if any child is. */
export function sidebarIsActive(item: NavItem, pathname: string): boolean {
  if (item.children?.length) return item.children.some((c) => sidebarIsActive(c, pathname));
  if (item.end) return pathname === item.to;
  if (item.to === "/daily") return /^\/(daily|weekly|monthly)(\/|$)/.test(pathname);
  // Strip query string for matching (e.g. /topics?group=opportunity).
  const toPath = item.to.split("?")[0];
  return pathname === toPath || pathname.startsWith(`${toPath}/`);
}

/**
 * The phone tab bar: 全部 lives beside 精选 as a switch, 热点 and 日报 are tabs, and "我的" at /more holds
 * 收藏, 外观, the tools and the site's own pages. Which tab a page sits under is declared by the page
 * itself (components/shell/screens.ts).
 */
export type TabKey =
  | "all"
  | "featured"
  | "hot"
  | "me"
  // A module's tab.
  | (string & {});

export interface Tab {
  key: TabKey;
  to: string;
  label: string;
  icon: (p: { size?: number }) => ReactNode;
  changelog?: boolean;
}

const ENGINE_TABS: Tab[] = [
  { key: "all", to: "/all", label: "全部", icon: IconDoc },
  { key: "featured", to: "/", label: "精选", icon: IconBolt },
  { key: "hot", to: "/hot", label: "热点", icon: IconFlame },
  { key: "me", to: "/more", label: "我的", icon: IconUser, changelog: true },
];

/** The tab bar: the engine's, the modules' before 我的. */
export function tabs(): Tab[] {
  return [...ENGINE_TABS.slice(0, -1).filter((t) => inNav(t.to)), ...webModules().flatMap((m) => m.tabs ?? []), ENGINE_TABS.at(-1)!];
}
