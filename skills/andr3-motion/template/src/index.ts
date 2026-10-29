import {LoadSkia} from '@shopify/react-native-skia/lib/module/web';
import {registerRoot} from 'remotion';

(async () => {
  await LoadSkia();
  const {Root} = await import('./Root');
  registerRoot(Root);
})();
