import { chatTarget, inboxRoute, noticeTarget, targetFor } from '../openTarget';

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

  it.each([
    ['STUDENT', '/(student)/pqrs/[id]'],
    ['TEACHER', '/(teacher)/pqrs/[id]'],
    ['SUPERADMIN', '/(admin)/pqrs/[id]'],
  ] as const)('opens the PQRS of a notice for the %s', (role, pathname) => {
    expect(noticeTarget(role, { moduleId: null, pqrsId: 'p-1' })).toEqual({ pathname, params: { id: 'p-1' } });
  });

  it('keeps opening the module of a module notice and leads nowhere without a subject', () => {
    expect(noticeTarget('STUDENT', { moduleId: 'm-1', pqrsId: null })).toEqual(targetFor('STUDENT', 'm-1'));
    expect(noticeTarget('STUDENT', { moduleId: null, pqrsId: null })).toBeNull();
  });

  it.each([
    ['STUDENT', '/(student)/messages/[id]'],
    ['TEACHER', '/(teacher)/messages/[id]'],
    ['SUPERADMIN', '/(admin)/messages/[id]'],
  ] as const)('opens the conversation of a chat push for the %s', (role, pathname) => {
    expect(chatTarget(role, 'c-1')).toEqual({ pathname, params: { id: 'c-1' } });
    expect(noticeTarget(role, { conversationId: 'c-1' })).toEqual({ pathname, params: { id: 'c-1' } });
  });

  it('leads the bell to the inbox of the role group', () => {
    expect(inboxRoute('STUDENT')).toBe('/(student)/notifications');
    expect(inboxRoute('TEACHER')).toBe('/(teacher)/notifications');
    expect(inboxRoute('SUPERADMIN')).toBe('/(admin)/notifications');
  });
});
