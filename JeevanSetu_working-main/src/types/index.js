/**
 * @typedef {Object} Profile
 * @property {string} id - Primary Key (FK to auth.users)
 * @property {'patient'|'donor'} role
 * @property {string} full_name
 * @property {string} [phone]
 * @property {string} [date_of_birth]
 * @property {'A+'|'A-'|'B+'|'B-'|'AB+'|'AB-'|'O+'|'O-'} [blood_group]
 * @property {string} [city]
 * @property {string} [state]
 * @property {boolean} [is_active]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

/**
 * @typedef {Object} PatientProfile
 * @property {string} id - Primary Key (FK to profiles.id)
 * @property {'Major'|'Intermedia'|'Minor'|'Not Diagnosed'} thalassemia_type
 * @property {string} emergency_contact_name
 * @property {string} emergency_contact_phone
 * @property {string} [treating_doctor]
 * @property {string} [treating_hospital]
 * @property {number} [diagnosis_year]
 * @property {string} [current_medications]
 * @property {string} [known_allergies]
 */

/**
 * @typedef {Object} DonorProfile
 * @property {string} id - Primary Key (FK to profiles.id)
 * @property {string} [gender]
 * @property {number} weight_kg
 * @property {string} [last_donation_date]
 * @property {string} [next_eligible_date]
 * @property {boolean} [is_available]
 * @property {boolean} [willing_to_travel]
 * @property {number} [max_travel_distance_km]
 * @property {string[]} [preferred_cities]
 * @property {string} [medical_conditions]
 * @property {boolean} [is_deferred]
 * @property {string} [deferral_until]
 * @property {number} [total_donations]
 * @property {number} [total_units_donated]
 */

/**
 * @typedef {Object} BloodRequest
 * @property {string} id - Primary Key
 * @property {string} patient_id - FK to profiles.id
 * @property {'A+'|'A-'|'B+'|'B-'|'AB+'|'AB-'|'O+'|'O-'} blood_group_needed
 * @property {number} units_required
 * @property {string} hospital_name
 * @property {string} [hospital_address]
 * @property {string} hospital_city
 * @property {string} [hospital_state]
 * @property {string} [required_by_date]
 * @property {'Emergency'|'Urgent'|'Routine'} urgency_level
 * @property {'Open'|'Donor Found'|'Fulfilled'|'Cancelled'} status
 * @property {string} [contact_number]
 * @property {string} [additional_notes]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */
export const Types = {};
