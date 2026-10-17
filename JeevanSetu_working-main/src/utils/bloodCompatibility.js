/**
 * Blood group compatibility rules.
 * Defines which blood groups a donor can donate to.
 */
export const CAN_DONATE_TO = {
  'O-':  ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'O+':  ['A+', 'B+', 'AB+', 'O+'],
  'A-':  ['A+', 'A-', 'AB+', 'AB-'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B+', 'B-', 'AB+', 'AB-'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB+', 'AB-'],
  'AB+': ['AB+']
};

/**
 * Checks if a donor blood group is compatible with a patient's requested blood group.
 * @param {string} donorGroup 
 * @param {string} patientGroup 
 * @returns {boolean}
 */
export const isCompatible = (donorGroup, patientGroup) => {
  if (!donorGroup || !patientGroup) return false;
  const list = CAN_DONATE_TO[donorGroup];
  return list ? list.includes(patientGroup) : false;
};

/**
 * Gets a list of donor blood groups that are compatible with a patient's blood group.
 * @param {string} patientGroup 
 * @returns {string[]}
 */
export const getCompatibleDonorGroups = (patientGroup) => {
  if (!patientGroup) return [];
  return Object.keys(CAN_DONATE_TO).filter(donorGroup => 
    CAN_DONATE_TO[donorGroup].includes(patientGroup)
  );
};
