// Registry: which function draws each screen. Screen order lives in src/flow/flow.ts.

import type { ScreenId, ScreenRenderer } from '../flow/flow';
import {
  chooseStrategyScreen,
  endingScreen,
  gameOverScreen,
  resultsScreen,
  whatWentWrongScreen,
} from './endgame';
import { outpostScreen } from './outpost';
import { dailyReportScreen, hazardSceneScreen, sleepSummaryScreen, warningScreen } from './reports';
import { bossCutsceneScreen, openingScreen } from './story';
import { titleScreen } from './title';

export const SCREENS: Record<ScreenId, ScreenRenderer> = {
  title: titleScreen,
  opening: openingScreen,
  outpost: outpostScreen,
  dailyReport: dailyReportScreen,
  warning: warningScreen,
  hazardScene: hazardSceneScreen,
  sleepSummary: sleepSummaryScreen,
  gameOver: gameOverScreen,
  whatWentWrong: whatWentWrongScreen,
  bossCutscene: bossCutsceneScreen,
  chooseStrategy: chooseStrategyScreen,
  ending: endingScreen,
  results: resultsScreen,
};
