export const britishSpellings = {
  // -ise endings
  customize: 'customise',
  personalize: 'personalise',
  specialize: 'specialise',
  
  // -our endings
  color: 'colour',
  behavior: 'behaviour',
  favorite: 'favourite',
  
  // -re endings
  center: 'centre',
  meter: 'metre',
  theater: 'theatre',
  
  // -ogue endings
  dialog: 'dialogue',
  catalog: 'catalogue',
  
  // -yse endings
  analyze: 'analyse',
  paralyze: 'paralyse',
  
  // Other common terms
  math: 'maths',
  program: 'programme',
  learned: 'learnt',
  burned: 'burnt',
  check: 'tick',
  preferences: 'settings'
};

export const convertToBritishEnglish = (text: string): string => {
  let britishText = text;
  Object.entries(britishSpellings).forEach(([american, british]) => {
    const regex = new RegExp(american, 'gi');
    britishText = britishText.replace(regex, british);
  });
  return britishText;
}; 