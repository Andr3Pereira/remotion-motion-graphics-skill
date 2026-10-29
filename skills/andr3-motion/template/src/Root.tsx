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
import {FORMATOS} from './lib/tokens';

// Cada insert é uma composição alimentada por um JSON em dados/. Para um doc novo,
// copia o JSON, troca os dados (só factos do ledger) e renderiza com --props.
const base = {...FORMATOS.doc, durationInFrames: 60};

export const Root = () => (
  <>
    <Composition id="Destaque" component={DestaqueCaptura} {...base} defaultProps={exemploDestaque as PropsDestaque} calculateMetadata={metaDestaque} />
    <Composition id="Numero" component={NumeroChave} {...base} defaultProps={exemploNumero as PropsNumero} calculateMetadata={metaNumero} />
    <Composition id="Mapa" component={MapaRelacoes} {...base} defaultProps={exemploMapa as PropsMapa} calculateMetadata={metaMapa} />
    <Composition id="Cronologia" component={Cronologia} {...base} defaultProps={exemploCronologia as PropsCronologia} calculateMetadata={metaCronologia} />
    <Still id="PaginaExemplo" component={PaginaExemplo} width={PAGINA.w} height={PAGINA.h} />
  </>
);
