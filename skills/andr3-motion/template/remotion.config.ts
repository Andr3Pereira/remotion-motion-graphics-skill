import {Config} from '@remotion/cli/config';
import {enableSkia} from '@remotion/skia/enable';

Config.overrideWebpackConfig((c) => {
  const s = enableSkia(c);
  return {...s, resolve: {...s.resolve, alias: {...s.resolve?.alias, 'react-native$': 'react-native-web'}}};
});
Config.setVideoImageFormat('png');
