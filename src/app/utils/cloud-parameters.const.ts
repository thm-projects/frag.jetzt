export interface DefaultCloudParameters {
  w1: string;
  w2: string;
  w3: string;
  w4: string;
  w5: string;
  w6: string;
  w7: string;
  w8: string;
  w9: string;
  w10: string;
  backgroundColor: string;
  hoverColor: string;
}

export const LIGHT_THEME: DefaultCloudParameters = {
  w1: 'dimgray',
  w2: 'brown',
  w3: 'olive',
  w4: 'seagreen',
  w5: 'teal',
  w6: 'navy',
  w7: 'green',
  w8: 'salmon',
  w9: 'darkorange',
  w10: 'red',
  backgroundColor: 'var(--background, moccasin)',
  hoverColor: 'var(--black, black)'
};

export const DARK_THEME: DefaultCloudParameters = {
  w1: 'gray',
  w2: 'SlateGray',
  w3: 'olive',
  w4: 'seagreen',
  w5: 'teal',
  w6: 'green',
  w7: 'darkorange',
  w8: 'FireBrick',
  w9: 'Tomato',
  w10: 'red',
  backgroundColor: 'var(--background, #121212)',
  hoverColor: 'var(--white, white)'
};
