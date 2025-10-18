import Resolver from '@forge/resolver';

const resolver = new Resolver();

resolver.define('getText', () => 'Frontend only demo — no backend yet.');

export const handler = resolver.getDefinitions();
