import { initialsOf } from '../initials';

describe('initialsOf', () => {
  it('is the initial of the first name and of the last name, in capitals', () => {
    expect(initialsOf('Ana', 'Soto')).toBe('AS');
  });

  it('is a single letter with a single name', () => {
    expect(initialsOf('Luis', '')).toBe('L');
    expect(initialsOf('', 'Gómez')).toBe('G');
  });

  it('ignores spaces and lowercase', () => {
    expect(initialsOf(' ana ', ' soto ')).toBe('AS');
  });

  it('keeps the accent of a letter', () => {
    expect(initialsOf('Ángela', 'Ñúñez')).toBe('ÁÑ');
  });

  it('is empty when there is no name', () => {
    expect(initialsOf('', '')).toBe('');
    expect(initialsOf('  ', ' ')).toBe('');
  });

  it('takes only the first name and the first surname of a compound name', () => {
    expect(initialsOf('María José', 'Pérez Gómez')).toBe('MP');
  });
});
