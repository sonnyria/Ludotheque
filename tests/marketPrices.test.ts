import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateMarketValue, getGameEstimatedValue} from '../src/utils/marketPriceGuide.ts';

test('a PS2 reference is not used for the PS5 remake', () => {
 assert.equal(estimateMarketValue('Silent Hill 2','PlayStation 2'),70);
 assert.notEqual(estimateMarketValue('Silent Hill 2','PlayStation 5'),70);
});
test('accented Pokemon names retain the correct reference', () => {
 assert.equal(estimateMarketValue('Pokémon Émeraude','Game Boy / Advance'),190);
});
test('a modern loose disc retains more value than an empty plastic box', () => {
 assert.ok(estimateMarketValue('Bloodborne','PlayStation 4','loose') > estimateMarketValue('Bloodborne','PlayStation 4','boite_seule'));
});
test('modern sealed prices are not universally double complete prices', () => {
 assert.ok(estimateMarketValue('Bloodborne','PlayStation 4','neuf') < 2 * estimateMarketValue('Bloodborne','PlayStation 4'));
});
test('a collector edition never inherits the ordinary edition reference', () => {
 assert.notEqual(estimateMarketValue('Silent Hill 2 Collector Edition','PlayStation 2'),70);
});
test('recent sports releases are not capped at three euros', () => {
 assert.ok(estimateMarketValue(`EA Sports FC ${String(new Date().getFullYear()).slice(-2)}`,'PlayStation 4') > 3);
});
test('digital copies have zero resale value even with an old stored estimate', () => {
 assert.equal(getGameEstimatedValue({title:'Bloodborne',console:'PlayStation 4',condition:'dematerialise',estimatedValue:18}),0);
});
test('invalid stored prices are not used in collection totals', () => {
 assert.equal(getGameEstimatedValue({title:'Bloodborne',console:'PlayStation 4',condition:'complet',estimatedValue:Infinity}),18);
});

test('Xbox 360 references do not leak into Xbox One',()=>{
 assert.equal(estimateMarketValue('Halo 3','Xbox 360'),8);
 assert.notEqual(estimateMarketValue('Starfield','Xbox One'),24);
 assert.equal(estimateMarketValue('Star Wars Knights of the Old Republic','Xbox Original'),25);
 assert.notEqual(estimateMarketValue('Star Wars Knights of the Old Republic','Xbox One'),25);
});
