import { drawCoolWaypoint, drawEspBox, drawLine, trace } from "../Coleweight/util/renderUtil"

var distances = undefined;
var coords = undefined;
var bestCoordinates;
var showChestLocation = 0;
var baseCoordinates;
var debug = false;
var searchingForBase = false;
var searchForBaseCooldown = 0;
let chestCoords = JSON.parse(FileLib.read("BetterMetalDetectorSolver", "coords.json"))

let lastLocation = [0, 0, 0];

register('actionBar', (dist, event) => {
    showChestLocation = 10;
    if (!baseCoordinates) findBaseCoordinates();
    let distance = parseFloat(ChatLib.removeFormatting(dist).trim());
    let playerX = Player.getX();
    let playerY = Player.getY();
    let playerZ = Player.getZ();
    distances = distance;
    coords = [playerX, playerY, playerZ]
}).setCriteria('TREASURE: ${rest}').setParameter('contains');

register('worldLoad', () => {
    baseCoordinates = null;
    reset();
});

register('chat', () => {
    reset();
}).setCriteria('&r&aYou found ${loot} &r&awith your &r&cMetal Detector&r&a!&r');

register('step', () => {
    if (lastLocation[0] !== Player.getX() || lastLocation[1] !== Player.getY() || lastLocation[2] !== Player.getZ()) {
        lastLocation = [Player.getX(), Player.getY(), Player.getZ()]
        return
    }
    if (searchForBaseCooldown) searchForBaseCooldown--;
    if (showChestLocation <= 0) return;
    showChestLocation--;
    let coordinates = getClosestChestLocation();
    if (!coordinates) return;
    if (bestCoordinates !== coordinates) {
        World.playSound('random.orb', 1, 10);
        ChatLib.chat('&3&lFound treasure!')
    }
    bestCoordinates = coordinates;
}).setFps(1);

register('renderWorld', (ticks) => {
    if (!baseCoordinates) return;
    if (debug) chestCoords.forEach((coords) =>
        Tessellator.drawString('CHEST', baseCoordinates[0] - coords[0] + 0.5, baseCoordinates[1] - coords[1] + 2, baseCoordinates[2] - coords[2] + 0.5, Renderer.GOLD, true, 0.1, false))
    if (showChestLocation <= 0 || !bestCoordinates) return;
    Tessellator.drawString('TREASURE', baseCoordinates[0] - bestCoordinates[0] + .5, baseCoordinates[1] - bestCoordinates[1] + 2, baseCoordinates[2] - bestCoordinates[2] + .5, Renderer.AQUA, true, 0.1, false);
    trace(baseCoordinates[0] - bestCoordinates[0] + .5, baseCoordinates[1] - bestCoordinates[1] + 2, baseCoordinates[2] - bestCoordinates[2] + .5, 0, 1, 0.8392156862745098, 1, 2.5)
});

register('command', () => {
    debug = !debug;
}).setName('togglemetaldetectordebugmode');
register('command', () => {
    reset();
}).setName('mdreset');

reset = () => {
    distances = [];
    coords = [];
    bestCoordinates = null;
    showChestLocation = 0;
}

findBaseCoordinates = () => {
    if (searchForBaseCooldown) return;
    new Thread(() => {
        searchingForBase = true;
        let x = ~~Player.getX();
        let y = ~~Player.getY();
        let z = ~~Player.getZ();
        for (let i = x - 50; i < x + 50; i++) {
            for (let j = y + 30; j >= y - 30; j--) {
                for (let k = z - 50; k < z + 50; k++) {
                    if (World.getBlockAt(i, j, k).getType().getID() === 156 && World.getBlockAt(i, j + 13, k).getType().getID() === 166) {
                        baseCoordinates = getBaseCoordinates(i, j + 13, k);
                        if (debug) ChatLib.chat('Found base coordinates: ' + JSON.stringify(baseCoordinates));
                        ChatLib.chat("&6[&dMetalDetectorSolver&6]&9 How to use:&b After finding a &6treasure&b, do not move for a second, until the next &6treasure&b location is highlighted. If the location is incorrect, stand still to recalculate it.")
                        searchingForBase = false;
                        return;
                    }
                }
            }
        }
        searchingForBase = false;
    }).start();
    searchForBaseCooldown = 15;
    if (debug) ChatLib.chat('§cCould\'t find crystal coordinates');
}

getBaseCoordinates = (x, y, z) => {
    let loop = true;
    let posX = x;
    let posY = y;
    let posZ = z;
    if (World.getBlockAt(x, y, z).getType().getID() !== 166) return [x, y, z];
    while (loop) {
        loop = false;
        if (World.getBlockAt(posX + 1, posY, posZ).getType().getID() == 166) {
            posX++;
            loop = true;
        }
        if (World.getBlockAt(posX, posY - 1, posZ).getType().getID() == 166) {
            posY--;
            loop = true;
        }
        if (World.getBlockAt(posX, posY, posZ + 1).getType().getID() == 166) {
            posZ++;
            loop = true;
        }
    }
    return [posX, posY, posZ];
}

getDistance = (x1, y1, z1, x2, y2, z2) => {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2);
}

getClosestChestLocation = () => {
    if (!baseCoordinates) return;
    let bestChestLocation;
    let minDistance = 100000;
    if (distances.length < 2) return;
    chestCoords.forEach((coordinates) => {
        let currentDistance = Math.abs(getDistance(coords[0], coords[1], coords[2], baseCoordinates[0] - coordinates[0], baseCoordinates[1] - coordinates[1], baseCoordinates[2] - coordinates[2]) - distances);

        if (currentDistance < minDistance) {
            minDistance = currentDistance;
            bestChestLocation = coordinates;
        }
    });
    return bestChestLocation;
}
