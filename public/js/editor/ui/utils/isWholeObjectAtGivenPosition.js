// @ts-nocheck
let THREE = window.THREE;

let box = THREE && new THREE.Box3();

export default function isWholeObjectAtGivenPosition({mesh, axis, position}){
    THREE =  THREE || window.THREE;
    box = box || THREE && new THREE.Box3();
    if (!box) return false;

    mesh.geometry.computeBoundingBox();
    box.copy( mesh.geometry.boundingBox ).applyMatrix4( mesh.matrixWorld );
    return Boolean(position >= box.min[axis] && position <= box.max[axis]);

}

window.isWholeObjectAtGivenPosition = isWholeObjectAtGivenPosition;