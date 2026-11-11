// End-of-run screens: game over, what went wrong, strategy choice, ending, results.

import { STRATEGY_STAT } from '../contract/engine';
import { RESOURCE_IDS, STRATEGIES } from '../contract/types';
import { endingAssetId } from '../content/assetManifest';
import { ENDING_TEXT, STRATEGY_INFO, deathExplanation } from '../content/dialogue';
import type { FlowContext } from '../flow/flow';
import { assetBox } from './assets';
import { dialogueBox, panel, resourceChip, screen } from './common';
import { button, h } from './dom';

export function gameOverScreen(ctx: FlowContext): HTMLElement {
  return screen(
    'gameover',
    h(
      'div',
      { class: 'cutscene' },
      assetBox('cut_game_over', { class: 'cutscene-image' }),
      h('h2', { text: 'GAME OVER' }),
      h('p', { class: 'cutscene-text', text: 'Health hit zero.' }),
      h(
        'div',
        { class: 'panel-actions' },
        button('What happened?', ctx.actions.next),
        button('Home', ctx.actions.toTitle, { variant: 'secondary' }),
      ),
    ),
  );
}

export function whatWentWrongScreen(ctx: FlowContext): HTMLElement {
  const cause = ctx.state?.deathCause;
  const { why, tips } = cause ? deathExplanation(cause) : { why: ['Unknown.'], tips: [] };
  return screen(
    'whatwentwrong',
    panel(
      'What happened?',
      [
        h('h3', { text: 'Why' }),
        h('ul', {}, ...why.map((w) => h('li', { text: w }))),
        h('h3', { text: 'Tips' }),
        ...tips.map((t) => dialogueBox('jamie', t, [])),
      ],
      [button('Results', ctx.actions.next)],
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
      h(
        'p',
        { class: 'strategy-check chip-row' },
        resourceChip(stat, `${have} / ${required}`, { tone: ready ? 'up' : 'down' }),
        ready ? h('span', { text: 'Ready!' }) : null,
      ),
      button('Pick', () => ctx.actions.chooseStrategy(strategy)),
    );
  });
  return screen(
    'strategy',
    panel(
      'Stop the alien!',
      [
        h('p', { text: 'Pick one plan. Only that number counts.' }),
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
        h('p', { class: 'muted chip-row' }, resourceChip(STRATEGY_STAT[b.strategy], `${b.actual} / ${b.required}`, { tone: 'down' })),
      h('div', { class: 'panel-actions' }, button('Results', ctx.actions.next)),
    ),
  );
}

export function resultsScreen(ctx: FlowContext): HTMLElement {
  const s = ctx.state;
  const o = s?.outcome;
  const outcomeText =
    o?.result === 'win' && o.strategy
      ? `You won! ${ENDING_TEXT[o.strategy].title}`
      : o?.result === 'bad'
        ? 'Alien won.'
        : 'Crew did not make it.';

  return screen(
    'results',
    panel(
      'Results',
      [
        h('p', { class: 'results-outcome', text: outcomeText }),
        s &&
          h(
            'ul',
            { class: 'results-stats' },
            h('li', { text: `Days: ${s.stats.daysSurvived} / ${ctx.rules.finalDay}` }),
            h('li', { text: `Tasks: ${s.stats.tasksCompleted}` }),
            h('li', { text: `AP used: ${s.stats.apSpent}` }),
            h('li', { text: `Hazards: ${s.stats.hazardsSurvived}` }),
            h('li', { text: `Damage blocked: ${s.stats.damageBlocked}` }),
          ),
        s &&
          h(
            'div',
            {},
            h('h3', { text: 'Supplies' }),
            h(
              'ul',
              { class: 'supply-list' },
              ...RESOURCE_IDS.map((r) =>
                h('li', {}, resourceChip(r, `${s.resources[r].current} / ${s.resources[r].max}`)),
              ),
            ),
          ),
        h('h3', { text: `Endings: ${ctx.profile.endingsUnlocked.length} / ${STRATEGIES.length}` }),
        h(
          'ul',
          { class: 'endings-list' },
          ...STRATEGIES.map((st) =>
            h('li', { text: ctx.profile.endingsUnlocked.includes(st) ? ENDING_TEXT[st].title : '???' }),
          ),
        ),
      ],
      [button('New Game', ctx.actions.tryAgain), button('Home', ctx.actions.toTitle, { variant: 'secondary' })],
    ),
  );
}
