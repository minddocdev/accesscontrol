// /**
//  *  Deep clones the source object while filtering its properties
//  *  by the given glob notations. Includes all matched properties
//  *  and removes the rest.
//  *
//  *  @param {Array|String} globNotations - The glob notation(s) to
//  *  be processed. The difference between normal notations and
//  *  glob-notations is that you can use wildcard stars (*) and
//  *  negate the notation by pre-pending a bang (!). A negated
//  *  notation will be excluded. Order of the globs do not matter,
//  *  they will be logically sorted. Loose globs will be processed
//  *  first and verbose globs or normal notations will be processed
//  *  last. e.g. `[ "car.model", "*", "!car.*" ]` will be sorted as
//  *  `[ "*", "!car.*", "car.model" ]`.
//  *  Passing no parameters or passing an empty string (`""` or `[""]`)
//  *  will empty the source object.
//  *  @chainable
//  *
//  *  @returns {Notation} - Returns the current `Notation` instance (self).
//  */
// export function filter(object: any, globNotations: any) {
//   let copy = utils.deepCopy(object);

//   // ensure array, normalize and sort the globs in logical order. we also
//   // concat the array first (to prevent mutating the original) bec. we'll
//   // change it's content via `.shift()`
//   let globs = NotationGlob.normalize(globNotations).concat();

//   // if globs only consist of "*"; set the "copy" as source and return.
//   if (utils.stringOrArrayOf(globs, '*')) {
//     return copy;
//   }
//   // if globs is "" or [""] set source to `{}` and return.
//   if (arguments.length === 0
//     || utils.stringOrArrayOf(globs, '')
//     || utils.stringOrArrayOf(globs, '!*')) {
//     return {};
//   }

//   let filtered;
//   // if the first item of sorted globs is "*" we set the source to the
//   // (full) "copy" and remove the "*" from globs (not to re-process).
//   if (globs[0] === '*') {
//     filtered = new Notation(copy);
//     globs.shift();
//   } else {
//     // otherwise we set an empty object as the source so that we can
//     // add notations/properties to it.
//     filtered = new Notation({});
//   }

//   let g, endStar, normalized;
//   // iterate through globs
//   utils.each(globs, (globNotation, index, array) => {
//     // console.log('--->', globNotation);
//     g = new NotationGlob(globNotation);
//     // set flag that indicates whether the glob ends with `.*`
//     endStar = g.absGlob.slice(-2) === '.*';
//     // get the remaining part as the (extra) normalized glob
//     normalized = endStar ? g.absGlob.slice(0, -2) : g.absGlob;
//     // normalized = endStar ? g.absGlob.replace(/(\.\*)+$/, '') : g.absGlob;
//     // check if normalized glob has no wildcard stars e.g. "a.b" or
//     // "!a.b.c" etc..
//     if (normalized.indexOf('*') < 0) {
//       if (g.isNegated) {
//         // directly remove the notation if negated
//         filtered.remove(normalized);
//         // if original glob had `.*` at the end, it means remove
//         // contents (not itself). so we'll set an empty object.
//         // meaning `some.prop` (prop) is removed completely but
//         // `some.prop.*` (prop) results in `{}`.
//         if (endStar) filtered.set(normalized, {}, true);
//       } else {
//         // directly copy the same notation from the original
//         filtered.copyFrom(original, normalized, null, true);
//       }
//       // move to the next
//       return true;
//     }
//     // if glob has wildcard star(s), we'll iterate through keys of the
//     // source object and see if (full) notation of each key matches
//     // the current glob.

//     // TODO: Optimize the loop below. Instead of checking each key's
//     // notation, get the non-star left part of the glob and iterate
//     // that property of the source object.
//     this.each((originalNotation, key, value, obj) => {
//       // console.log('>>', originalNotation);

//       // iterating each note of original notation. i.e.:
//       // note1.note2.note3 is iterated from left to right, as:
//       // 'note1', 'note1.note2', 'note1.note2.note3' — in order.
//       Notation.eachNote(originalNotation, (levelNotation, note, index, list) => {
//         if (g.test(levelNotation)) {
//           if (g.isNegated) {
//             // console.log('removing', levelNotation, 'of', originalNotation);
//             filtered.remove(levelNotation);
//             // we break and return early if removed bec. deeper
//             // level props are also removed with this parent.
//             // e.g. when 'note1.note2' of 'note1.note2.note3' is
//             // removed, we no more have 'note3'.
//             return false;
//           }
//           filtered.set(levelNotation, value, true);
//         }
//       });
//     });
//   });
//   return filtered.value;
// }
