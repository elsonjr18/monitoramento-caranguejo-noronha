export enum CrabColor {
  AMARELO = 'Amarelo',
  LARANJA_AVERMELHADO = 'Laranja ou avermelhado',
  ROXO_ESCURO = 'Roxo ou escuro',
  BRANCO_PALIDO = 'Branco ou pálido',
  OUTRA_COR = 'Outra cor',
  NAO_IDENTIFICADO = 'Não consegui identificar'
}

export enum CrabStatus {
  VIVO = 'Vivo',
  ATROPELADO_VIVO = 'Atropelado, ainda vivo',
  ATROPELADO_MORTO = 'Atropelado, sem vida',
  MORTO = 'Morto, sem evidência de atropelamento'
}

export enum EggVisibility {
  VISIBLE = 'Sim, vi ovos',
  NOT_VISIBLE = 'Não havia ovos visíveis',
  NOT_OBSERVED = 'Não consegui ver essa parte do animal'
}

export enum CrabSex {
  MALE = 'Macho',
  FEMALE = 'Fêmea',
  NOT_IDENTIFIED = 'Não foi possível identificar'
}

export enum CrabSizeClass {
  SMALL = 'Pequeno',
  MEDIUM = 'Médio',
  LARGE = 'Grande',
  NOT_ESTIMATED = 'Não foi possível estimar'
}

export enum CountType {
  EXACT = 'Contagem exata',
  ESTIMATED = 'Aproximadamente',
  MANY = 'Muitos (numerosos)',
  NOT_COUNTED = 'Não consegui contar'
}

export enum CrabMovementPattern {
  ANDANDO = 'Andando',
  PARADO_ATIVO = 'Parado no mesmo lugar, mas ativo',
  TOTALMENTE_PARADO = 'Totalmente parado',
  NAO_OBSERVADO = 'Não consegui observar'
}

export enum CrabActivity {
  ALIMENTANDO = 'Comendo alguma coisa',
  CAVANDO_TOCA = 'Cavando ou mexendo na toca',
  LIMPANDO_PATAS = 'Limpando as garras ou patas',
  INTERACAO = 'Interagindo ou brigando com outro',
  ACASALANDO = 'Acasalando',
  ANDADA = 'Andada — vários caranguejos se deslocando',
  OUTRA = 'Outra atividade',
  NAO_IDENTIFICADA = 'Não foi possível identificar'
}

export enum LocationSource {
  EXIF_FOTO = 'EXIF_FOTO',
  GPS_APARELHO = 'GPS_APARELHO',
  NAO_DISPONIVEL = 'NAO_DISPONIVEL'
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  isFromPhoto?: boolean;
  isFromDevice?: boolean;
}

export interface ObservationData {
  id?: string;
  localId?: string;
  timestamp: string;
  timestampISO?: string;
  location: GeoLocation | null;
  photoUrl: string | null;
  status: CrabStatus | '';
  color: CrabColor | '';
  eggVisibility: EggVisibility | '';
  amount: number | '';
  countType?: CountType | '';
  habitat: string;
  notes: string;
  sex?: CrabSex | '';
  sizeClass?: CrabSizeClass | '';
  movementPattern?: CrabMovementPattern | '';
  activity?: CrabActivity | '';
  behavior?: string; // Kept for compatibility if needed internally, but movementPattern+activity is primary
  collisionRisk?: string;
  weather?: string;
  moonData?: {
    moonPhase: string;
    moonAge: number;
    moonIllumination: number;
  };
}