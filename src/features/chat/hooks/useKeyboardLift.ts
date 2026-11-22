import { useCallback, useEffect, useRef, useState, type ElementRef } from 'react';
import { Keyboard, Platform, View } from 'react-native';

type Node = ElementRef<typeof View>;

// How far the keyboard covers the bottom of the view that gets `ref`. KeyboardAvoidingView measures against
// its parent, so with tabs or insets around it (and edge-to-edge Android) it lifts too little; this measures
// against the window instead.
export function useKeyboardLift() {
  const node = useRef<Node | null>(null);
  const ref = useCallback((value: Node | null) => {
    node.current = value;
  }, []);
  const [lift, setLift] = useState(0);

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (event) => {
      node.current?.measureInWindow((_x, y, _w, height) => setLift(Math.max(0, y + height - event.endCoordinates.screenY)));
    });
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setLift(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return [ref, lift] as const;
}
