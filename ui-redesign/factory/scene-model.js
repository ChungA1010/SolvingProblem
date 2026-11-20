/* Dimensionless display geometry; not equipment dimensions or a contact mechanics model. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CMPSceneModel = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function() {
  'use strict';
  function geometry(frame, {cutaway=false}={}) {
    const engagement = frame ? frame.engagement : 0;
    // Overview keeps a thin pad/wafer. Only the explanatory section exaggerates
    // thickness and compliance; neither view changes the playback/calculation.
    const padBaseHeight = cutaway ? .24 : .06;
    const filmBaseHeight = cutaway ? .15 : .006;
    const waferHeight = cutaway ? .075 : .018;
    const padHeight = padBaseHeight - (frame ? frame.compression / 14 * (cutaway ? .10 : .0015) : 0);
    const padTop = .42 + padHeight;
    const gap = .38 * (1 - engagement);
    const filmHeight = filmBaseHeight * (frame ? 1 - frame.removedFraction : 1);
    const filmBottom = padTop + gap;
    return { padBaseHeight, filmBaseHeight, waferHeight, padHeight, padTop,
      padRestTop:.42+padBaseHeight, padDepth:padBaseHeight-padHeight, gap, filmHeight, filmBottom,
      waferBottom:filmBottom + filmHeight, waferTop:filmBottom + filmHeight + waferHeight,
      // Rotation and liquid motion are illustrative and independent of input pressure.
      padRotation:frame ? -(frame.stageRotation ?? frame.rotation) * Math.PI / 180 * .55 : 0,
      headRotation:frame ? frame.rotation * Math.PI / 180 * .30 : 0,
      contacting:!!frame && frame.phase === 'contact', phase:frame ? frame.phase : 'idle' };
  }
  // Flat contact footprint plus a smooth surrounding falloff; display deformation only.
  function padContact(x,z,depth) {
    const dx=x-.8,dz=z-.18,r=Math.hypot(dx,dz);
    if (r<=1.32) return { drop:depth,dx:0,dz:0 };
    if (r>=1.75) return { drop:0,dx:0,dz:0 };
    const t=(r-1.32)/.43,f=1-3*t*t+2*t*t*t,derivative=(-6*t+6*t*t)/.43;
    return {drop:depth*f,dx:depth*derivative*dx/r,dz:depth*derivative*dz/r};
  }
  return { geometry,padContact };
});
