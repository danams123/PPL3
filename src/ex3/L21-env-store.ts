import { add, map, zipWith, lastIndexOf, append } from "ramda";
import { Value } from './L21-value-store';
import { Result, makeFailure, makeOk, bind, either, isOk } from "../shared/result";

// ========================================================
// Box datatype
// Encapsulate mutation in a single type.
type Box<T> = T[];
const makeBox = <T>(x: T): Box<T> => ([x]);
const unbox = <T>(b: Box<T>): T => b[0];
const setBox = <T>(b: Box<T>, v: T): void => { b[0] = v; return; }

// ========================================================
// Store datatype
export interface Store {
    tag: "Store";
    vals: Box<Value>[];
}

export const isStore = (x: any): x is Store => x.tag === "Store";
export const makeEmptyStore = (): Store => ({ tag: "Store", vals: [] });
export const theStore: Store = makeEmptyStore();
// export const makeStore = (x: Value): Store => ({ tag: "Store", vals: [makeBox(x)] });
export const extendStore = (s: Store, val: Value): Store => {
    s.vals = append(makeBox(val), (s.vals));
    return s;
}

export const applyStore = (store: Store, address: number): Result<Value> => {
    return (address >= 0 && address < store.vals.length) ? makeOk(unbox(store.vals[address])) : makeFailure("illegal address");
}


export const setStore = (store: Store, address: number, val: Value): void => {
    console.log(unbox(store.vals[address]));
    if (isOk(applyStore(store, address))) store.vals[address] = makeBox(val);
    console.log(unbox(store.vals[address]));

}

export const getAddress = (s: Store, val: Value): number => {
    return lastIndexOf(makeBox(val), theStore.vals);
}

// ========================================================
// Environment data type
// export type Env = EmptyEnv | ExtEnv;
export type Env = GlobalEnv | ExtEnv;

interface GlobalEnv {
    tag: "GlobalEnv";
    vars: Box<string[]>;
    addresses: Box<number[]>
}

export interface ExtEnv {
    tag: "ExtEnv";
    vars: string[];
    addresses: number[];
    nextEnv: Env;
}

const makeGlobalEnv = (): GlobalEnv =>
    ({ tag: "GlobalEnv", vars: makeBox([]), addresses: makeBox([]) });

export const isGlobalEnv = (x: any): x is GlobalEnv => x.tag === "GlobalEnv";

// There is a single mutable value in the type Global-env
export const theGlobalEnv = makeGlobalEnv();

export const makeExtEnv = (vs: string[], addresses: number[], env: Env): ExtEnv =>
    ({ tag: "ExtEnv", vars: vs, addresses: addresses, nextEnv: env });

export const isExtEnv = (x: any): x is ExtEnv => x.tag === "ExtEnv";

export const isEnv = (x: any): x is Env => isGlobalEnv(x) || isExtEnv(x);

// Apply-env
export const applyEnv = (env: Env, v: string): Result<number> =>
    isGlobalEnv(env) ? applyGlobalEnv(env, v) :
        applyExtEnv(env, v);

const applyGlobalEnv = (env: GlobalEnv, v: string): Result<number> => {
    console.log("in Glob");
    const vars = map(unbox, theGlobalEnv.vars);
    const pos = vars.lastIndexOf(v);
    return (pos > -1) ? makeOk(unbox(theGlobalEnv.addresses[pos])) : makeFailure("var not found");
}

export const globalEnvAddBinding = (v: string, addr: number): void => {
    const ge = theGlobalEnv;
    ge.vars = append(makeBox(v), ge.vars);
    ge.addresses = append(makeBox(addr), ge.addresses);
}

const applyExtEnv = (env: ExtEnv, v: string): Result<number> => {
    console.log("in Ext");
    return env.vars.includes(v) ? makeOk(env.addresses[env.vars.lastIndexOf(v)]) :
        applyEnv(env.nextEnv, v);
}