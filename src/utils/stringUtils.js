export const generalizeName = (rawName) => {
  if (!rawName) {
    return '';
  }
  return rawName.replace(' ', '').toLowerCase();  
};
