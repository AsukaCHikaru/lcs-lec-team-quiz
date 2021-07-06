export type Team = {
  year: Year;
  split: Split;
  players: Record<Position, Player>;
  name: string;
  abbr: string;
}

export type Player = {
  ign: string;
  nationality: Nationality;
  position: Position;
}

export type Nationality = 'US' | 'CA' | 'DK' | 'KR' | 'CN' | 'DE';

export type Year = '2011' | '2012' | '2013' | '2014';

export type Split = 'spring' | 'summer';

export type Position = 'TOP' | 'JG' | 'MID' | 'BOT' | 'SPT';
