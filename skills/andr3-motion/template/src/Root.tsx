import {Composition, Still} from 'remotion';
import exemploCronologia from '../dados/cronologia-exemplo.json';
import exemploDestaque from '../dados/destaque-exemplo.json';
import exemploMapa from '../dados/mapa-exemplo.json';
import exemploNumero from '../dados/numero-exemplo.json';
import {Cronologia, metaCronologia, type PropsCronologia} from './comps/Cronologia';
import {DestaqueCaptura, metaDestaque, type PropsDestaque} from './comps/DestaqueCaptura';
import {MapaRelacoes, metaMapa, type PropsMapa} from './comps/MapaRelacoes';
import {NumeroChave, metaNumero, type PropsNumero} from './comps/NumeroChave';
import {PAGINA, PaginaExemplo} from './comps/PaginaExemplo';
import {meta} from './lib/tokens';

// Cada insert é uma composição alimentada por um JSON em dados/. O perfil do JSON
// (short, longo, dark, hibrido) decide dimensões, cadência, fontes e cores.
// Render: npx remotion render src/index.ts <Comp> out/x.mov --props=dados/x.json --scale=2 ...
const base = {...meta('dark'), durationInFrames: 60};

export const Root = () => (
  <>
    <Composition id="Destaque" component={DestaqueCaptura} {...base} defaultProps={exemploDestaque as PropsDestaque} calculateMetadata={metaDestaque} />
    <Composition id="Numero" component={NumeroChave} {...base} defaultProps={exemploNumero as PropsNumero} calculateMetadata={metaNumero} />
    <Composition id="Mapa" component={MapaRelacoes} {...base} defaultProps={exemploMapa as PropsMapa} calculateMetadata={metaMapa} />
    <Composition id="Cronologia" component={Cronologia} {...base} defaultProps={exemploCronologia as PropsCronologia} calculateMetadata={metaCronologia} />
    <Still id="PaginaExemplo" component={PaginaExemplo} width={PAGINA.w} height={PAGINA.h} />
  </>
);
