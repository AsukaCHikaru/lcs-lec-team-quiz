import { Player, Position } from './types';

export const players: Record<Position, Record<Player['ign'], Player>> = {
  TOP: {
    Dyrus: {
      ign: 'Dyrus',
      position: 'TOP',
      nationality: 'US',
    },
  },
  JG: {
    TheOddOne: {
      ign: 'TheOddOne',
      position: 'JG',
      nationality: 'CA',
    },
    Amazing: {
      ign: 'Amazing',
      position: 'JG',
      nationality: 'DE',
    },
  },
  MID: {
    Reginald: {
      ign: 'Reginald',
      position: 'MID',
      nationality: 'US',
    },
    Bjergsen: {
      ign: 'Bjergsen',
      position: 'MID',
      nationality: 'DK',
    },
  },
  BOT: {
    Chaox: {
      ign: 'Chaox',
      position: 'BOT',
      nationality: 'CN',
    },
    WildTurtle: {
      ign: 'WildTurtle',
      position: 'BOT',
      nationality: 'CA',
    },
  },
  SPT: {
    Xpecial: {
      ign: 'Xpecial',
      position: 'SPT',
      nationality: 'CA',
    },
    Lustboy: {
      ign: 'Lustboy',
      position: 'SPT',
      nationality: 'KR',
    },
  },
};
