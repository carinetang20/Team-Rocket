// End-of-run screens: game over, what went wrong, strategy choice, ending, results.

import { STRATEGY_STAT } from '../contract/engine';
import { RESOURCE_IDS, STRATEGIES } from '../contract/types';
import { endingAssetId } from '../content/assetManifest';
import { ENDING_TEXT, RESOURCE_LABELS, STRATEGY_INFO, deathExplanation } from '../content/dialogue';
import type { FlowContext } from '../flow/flow';
import { assetBox } from './assets';
import { dialogueBox, panel, screen } from './common';
import { button, h } from './dom';

export function gameOverScreen(ctx: FlowContext): HTMLElement {
  return screen(
    'gameover',
    h(
      'div',
      { class: 'cutscene' },
      assetBox('cut_game_over', { class: 'cutscene-image' }),
      h('h2', { text: 'Game Over' }),
      h('p', { class: 'cutscene-text', text: "The crew's health reached zero. The mission could not continue." }),
      h('div', { class: 'panel-actions' }, button('What went wrong?', ctx.actions.next)),
    ),
  );
}

export function whatWentWrongScreen(ctx: FlowContext): HTMLElement {
  const cause = ctx.state?.deathCause;
  const { why, tips } = cause ? deathExplanation(cause) : { why: ['Unknown.'], tips: [] };
  return screen(
    'whatwentwrong',
    panel(
      '🤔 What went wrong?',
      [
        h('h3', { text: 'Why it happened' }),
        h('ul', {}, ...why.map((w) => h('li', { text: w }))),
        h('h3', { text: 'Tips for next time' }),
        ...tips.map((t) => dialogueBox('jamie', t, [])),
      ],
      [button('See results', ctx.actions.next)],
    ),
  );
}

export function chooseStrategyScreen(ctx: FlowContext): HTMLElement {
  const s = ctx.state;
  const required = ctx.rules.endingRequired;
  const cards = STRATEGIES.map((strategy) => {
    const stat = STRATEGY_STAT[strategy];
    const have = s?.resources[stat].current ?? 0;
    const ready = have >= required;
    const info = STRATEGY_INFO[strategy];
    return h(
      'div',
      { class: `strategy-card ${ready ? 'ready' : ''}` },
      h('h3', { text: info.title }),
      h('p', { text: info.description }),
      h('p', { class: 'strategy-check', text: `${RESOURCE_LABELS[stat]}: ${have} / ${required} needed ${ready ? '✅' : '❌'}` }),
      button('Choose this plan', () => ctx.actions.chooseStrategy(strategy)),
    );
  });
  return screen(
    'strategy',
    panel(
      '👾 How will you stop the alien?',
      [
        h('p', { text: 'Only the stat for your chosen plan is checked. Pick wisely!' }),
        h('div', { class: 'strategy-grid' }, ...cards),
      ],
      [],
    ),
  );
}

export function endingScreen(ctx: FlowContext): HTMLElement {
  const b = ctx.bossEvent;
  const key = b?.success ? b.strategy : 'bad';
  const text = ENDING_TEXT[key];
  return screen(
    'ending',
    h(
      'div',
      { class: 'cutscene' },
      assetBox(endingAssetId(key), { class: 'cutscene-image' }),
      h('h2', { text: text.title }),
      h('p', { class: 'cutscene-text', text: text.text }),
      b &&
        !b.success &&
        h('p', {
          class: 'muted',
          text: `Your plan needed ${b.required} ${RESOURCE_LABELS[STRATEGY_STAT[b.strategy]]}, but you had ${b.actual}.`,
        }),
      h('div', { class: 'panel-actions' }, button('See results', ctx.actions.next)),
    ),
  );
}

export function resultsScreen(ctx: FlowContext): HTMLElement {
  const s = ctx.state;
  const o = s?.outcome;
  const outcomeText =
    o?.result === 'win' && o.strategy
      ? `🏆 You won! Ending: ${ENDING_TEXT[o.strategy].title}`
      : o?.result === 'bad'
        ? '💔 The alien won this time.'
        : '💀 The crew did not survive.';

  return screen(
    'results',
    panel(
      '📊 Mission Results',
      [
        h('p', { class: 'results-outcome', text: outcomeText }),
        s &&
          h(
            'ul',
            { class: 'results-stats' },
            h('li', { text: `Days survived: ${s.stats.daysSurvived} / ${ctx.rules.finalDay}` }),
            h('li', { text: `Tasks completed: ${s.stats.tasksCompleted}` }),
            h('li', { text: `AP spent: ${s.stats.apSpent}` }),
            h('li', { text: `Hazards survived: ${s.stats.hazardsSurvived}` }),
            h('li', { text: `Damage blocked by upgrades: ${s.stats.damageBlocked}` }),
          ),
        s &&
          h(
            'div',
            {},
            h('h3', { text: 'Final supplies' }),
            h(
              'ul',
              { class: 'supply-list' },
              ...RESOURCE_IDS.map((r) => h('li', { text: `${RESOURCE_LABELS[r]}: ${s.resources[r].current} / ${s.resources[r].max}` })),
            ),
          ),
        h('h3', { text: `Endings unlocked: ${ctx.profile.endingsUnlocked.length} / ${STRATEGIES.length}` }),
        h(
          'ul',
          { class: 'endings-list' },
          ...STRATEGIES.map((st) =>
            h('li', { text: ctx.profile.endingsUnlocked.includes(st) ? `✅ ${ENDING_TEXT[st].title}` : '❓ ???' }),
          ),
        ),
      ],
      [button('Try Again', ctx.actions.tryAgain), button('Title Screen', ctx.actions.toTitle, { variant: 'secondary' })],
    ),
  );
}
