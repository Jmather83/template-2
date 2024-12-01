export const errorMessages = {
  // Authentication errors
  invalidLogin: 'Your login details are incorrect. Please try again.',
  invalidPin: 'The PIN must be 4 digits.',
  pinMismatch: 'The PINs do not match.',
  
  // Form validation errors
  requiredField: 'This field is required.',
  invalidEmail: 'Please enter a valid email address.',
  invalidAge: 'Age must be between 4 and 12.',
  
  // API errors
  apiError: 'There was an issue connecting to the service. Please try again.',
  imageGenerationError: 'We could not generate your character image. Please try again.',
  savingError: 'Your changes could not be saved. Please try again.',
  
  // System notifications
  saveSuccess: 'Your changes have been saved successfully.',
  characterUpdated: 'Your character has been updated successfully.',
  listCreated: 'The spelling list has been created successfully.',
  
  // Loading states
  generating: 'Generating your character...',
  saving: 'Saving your changes...',
  loading: 'Loading...'
}; 