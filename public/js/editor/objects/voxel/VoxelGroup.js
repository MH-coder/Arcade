import { BufferAttribute, MeshLambertMaterial, BufferGeometry, Object3D, Mesh, MathUtils, Vector3 } from "../../libs/three.module.js";

class VoxelGroup extends Mesh {
    constructor(size) {
        super(this.geometry, this.material);

        let geometry = new BufferGeometry();
        let material = new MeshLambertMaterial({ color: 'green' });

        this.geometry = geometry;
        this.material = material;
        this.name = "voxelgroup";
        this.type = "VoxelGroup";

        this.size = size;
        this.sliceSize = size * size;
        this.cell = new Uint8Array(size * size * size);

        this.updateGeometry();

    }
    computeVoxelOffset(x, y, z) {

        const { size, sliceSize } = this;
        const voxelX = MathUtils.euclideanModulo(x, size) | 0;
        const voxelY = MathUtils.euclideanModulo(y, size) | 0;
        const voxelZ = MathUtils.euclideanModulo(z, size) | 0;

        return voxelY * sliceSize + voxelZ * size + voxelX;

    }
    getCellForVoxel(x, y, z) {

        const { size } = this;
        const cellX = Math.floor(x / size);
        const cellY = Math.floor(y / size);
        const cellZ = Math.floor(z / size);

        if (cellX !== 0 || cellY !== 0 || cellZ !== 0) {

            return null;

        }

        return this.cell;

    }
    setVoxel(x, y, z, v) {

        const cell = this.getCellForVoxel(x, y, z);

        if (!cell)
            return;

        const voxelOffset = this.computeVoxelOffset(x, y, z);
        cell[voxelOffset] = v;

    }
    getVoxel(x, y, z) {

        const cell = this.getCellForVoxel(x, y, z);

        if (!cell)
            return 0;

        const voxelOffset = this.computeVoxelOffset(x, y, z);

        return cell[voxelOffset];

    }
    generateGeometryDataForCell(cellX, cellY, cellZ) {

        const { size } = this;
        const positions = [];
        const normals = [];
        const indices = [];
        const startX = cellX * size;
        const startY = cellY * size;
        const startZ = cellZ * size;

        for (let y = 0; y < size; y++) {

            const voxelY = startY + y;

            for (let z = 0; z < size; z++) {

                const voxelZ = startZ + z;

                for (let x = 0; x < size; ++x) {

                    const voxelX = startX + x;
                    const voxel = this.getVoxel(voxelX, voxelY, voxelZ);

                    if (voxel) {

                        for (const { dir, corners } of VoxelGroup.faces) {

                            const neighbor = this.getVoxel(voxelX + dir[0], voxelY + dir[1], voxelZ + dir[2]);

                            if (!neighbor) {

                                const ndx = positions.length / 3;

                                for (const pos of corners) {

                                    positions.push(pos[0] + x, pos[1] + y, pos[2] + z);
                                    normals.push(...dir);

                                }

                                indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);

                            }

                        }

                    }

                }

            }
        }

        return { positions, normals, indices };
    }
    updateGeometry() {

        const { positions, normals, indices } = this.generateGeometryDataForCell(0, 0, 0);

        this.geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
        this.geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
        this.geometry.setIndex(indices);

        this.geometry.computeBoundingBox();
    }
    intersectRay(start, end) {

        let dx = end.x - start.x;
        let dy = end.y - start.y;
        let dz = end.z - start.z;
        const lenSq = dx * dx + dy * dy + dz * dz;
        const len = Math.sqrt(lenSq);

        dx /= len;
        dy /= len;
        dz /= len;

        let t = 0.0;
        let ix = Math.floor(start.x);
        let iy = Math.floor(start.y);
        let iz = Math.floor(start.z);

        const stepX = (dx > 0) ? 1 : -1;
        const stepY = (dy > 0) ? 1 : -1;
        const stepZ = (dz > 0) ? 1 : -1;

        const txDelta = Math.abs(1 / dx);
        const tyDelta = Math.abs(1 / dy);
        const tzDelta = Math.abs(1 / dz);

        const xDist = (stepX > 0) ? (ix + 1 - start.x) : (start.x - ix);
        const yDist = (stepY > 0) ? (iy + 1 - start.y) : (start.y - iy);
        const zDist = (stepZ > 0) ? (iz + 1 - start.z) : (start.z - iz);

        // location of nearest voxel boundary, in units of t
        let txMax = (txDelta < Infinity) ? txDelta * xDist : Infinity;
        let tyMax = (tyDelta < Infinity) ? tyDelta * yDist : Infinity;
        let tzMax = (tzDelta < Infinity) ? tzDelta * zDist : Infinity;

        let steppedIndex = -1;

        // main loop along raycast vector
        while (t <= len) {
            const voxel = this.getVoxel(ix, iy, iz);
            if (voxel) {
                return {
                    position: [
                        start.x + t * dx,
                        start.y + t * dy,
                        start.z + t * dz,
                    ],
                    normal: [
                        steppedIndex === 0 ? -stepX : 0,
                        steppedIndex === 1 ? -stepY : 0,
                        steppedIndex === 2 ? -stepZ : 0,
                    ],
                    voxel,
                };
            }

            // advance t to next nearest voxel boundary
            if (txMax < tyMax) {
                if (txMax < tzMax) {
                    ix += stepX;
                    t = txMax;
                    txMax += txDelta;
                    steppedIndex = 0;
                } else {
                    iz += stepZ;
                    t = tzMax;
                    tzMax += tzDelta;
                    steppedIndex = 2;
                }
            } else {
                if (tyMax < tzMax) {
                    iy += stepY;
                    t = tyMax;
                    tyMax += tyDelta;
                    steppedIndex = 1;
                } else {
                    iz += stepZ;
                    t = tzMax;
                    tzMax += tzDelta;
                    steppedIndex = 2;
                }
            }
        }
        return null;

    }
    toJSON(meta) {

        var data = Object3D.prototype.toJSON.call(this, meta);
        data.size = this.size;

        return data;

    }
}









VoxelGroup.faces = [
    {
        // left
        dir: [ -1,  0,  0, ],
        corners: [
            [ 0, 1, 0 ],
            [ 0, 0, 0 ],
            [ 0, 1, 1 ],
            [ 0, 0, 1 ],
        ],
    },
    {
        // right
        dir: [  1,  0,  0, ],
        corners: [
            [ 1, 1, 1 ],
            [ 1, 0, 1 ],
            [ 1, 1, 0 ],
            [ 1, 0, 0 ],
        ],
    },
    {
        // bottom
        dir: [  0, -1,  0, ],
        corners: [
            [ 1, 0, 1 ],
            [ 0, 0, 1 ],
            [ 1, 0, 0 ],
            [ 0, 0, 0 ],
        ],
    },
    {
        // top
        dir: [  0,  1,  0, ],
        corners: [
            [ 0, 1, 1 ],
            [ 1, 1, 1 ],
            [ 0, 1, 0 ],
            [ 1, 1, 0 ],
        ],
    },
    {
        // back
        dir: [  0,  0, -1, ],
        corners: [
            [ 1, 0, 0 ],
            [ 0, 0, 0 ],
            [ 1, 1, 0 ],
            [ 0, 1, 0 ],
        ],
    },
    {
        // front
        dir: [  0,  0,  1, ],
        corners: [
            [ 0, 0, 1 ],
            [ 1, 0, 1 ],
            [ 0, 1, 1 ],
            [ 1, 1, 1 ],
        ],
    },
];

export { VoxelGroup };
