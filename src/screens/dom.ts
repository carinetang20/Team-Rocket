// Tiny DOM helpers so screens stay short and readable. No framework needed.

export type Child = Node | string | number | null | undefined | false;

export interface Props {
  class?: string;
  text?: string;
  title?: string;
  disabled?: boolean;
  style?: string;
  attrs?: Record<string, string>;
  onClick?: (e: MouseEvent) => void;
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props.class) el.className = props.class;
  if (props.text !== undefined) el.textContent = props.text;
  if (props.title) el.title = props.title;
  if (props.style) el.setAttribute('style', props.style);
  if (props.disabled && el instanceof HTMLButtonElement) el.disabled = true;
  if (props.attrs) for (const [k, v] of Object.entries(props.attrs)) el.setAttribute(k, v);
  const onClick = props.onClick;
  if (onClick) el.addEventListener('click', (e) => onClick(e as MouseEvent));
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === 'number' ? String(c) : c);
  }
  return el;
}

export function button(
  label: string,
  onClick: () => void,
  opts: { disabled?: boolean; variant?: 'primary' | 'secondary' | 'danger'; title?: string } = {},
): HTMLButtonElement {
  return h('button', {
    class: `btn btn-${opts.variant ?? 'primary'}`,
    text: label,
    disabled: opts.disabled,
    title: opts.title,
    onClick: () => onClick(),
  });
}

/** Make any element behave like a button (click, Enter, Space) for mouse, touch and keyboard. */
export function clickable<T extends HTMLElement>(el: T, onClick: () => void, label: string): T {
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', label);
  el.tabIndex = 0;
  el.addEventListener('click', () => onClick());
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  });
  return el;
}
