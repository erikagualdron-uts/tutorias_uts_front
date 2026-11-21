import { inboxRoute, targetFor } from '../openTarget';

describe('notification targets', () => {
  it('opens the module detail of the student', () => {
    expect(targetFor('STUDENT', 'm-1')).toEqual({ pathname: '/(student)/modules/[id]', params: { id: 'm-1' } });
  });

  it('opens the schedule of the teacher, where the sessions of the module are', () => {
    expect(targetFor('TEACHER', 'm-1')).toBe('/(teacher)/schedule');
  });

  it('opens the module detail of the CAE', () => {
    expect(targetFor('SUPERADMIN', 'm-1')).toEqual({ pathname: '/(admin)/modules/[id]', params: { id: 'm-1' } });
  });

  it('leads the bell to the inbox of the role group', () => {
    expect(inboxRoute('STUDENT')).toBe('/(student)/notifications');
    expect(inboxRoute('TEACHER')).toBe('/(teacher)/notifications');
    expect(inboxRoute('SUPERADMIN')).toBe('/(admin)/notifications');
  });
});
