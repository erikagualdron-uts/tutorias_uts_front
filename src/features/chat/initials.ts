const first = (name: string) => name.trim().charAt(0).toLocaleUpperCase();

// The letters of an avatar: the initial of the first name and of the last name (one letter with a single name,
// none without a name). Not saved: calculated from the name the conversation already carries (spec 022).
export const initialsOf = (firstName: string, lastName: string): string => `${first(firstName)}${first(lastName)}`;
