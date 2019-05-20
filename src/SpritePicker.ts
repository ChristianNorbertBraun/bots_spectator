export type SpritePicker = (c: string) => number | undefined;

const bombChars = "987654321";
const playerChars = "ABCDEFGHIJKLMNOP";
const orientationChars = "^><v";
const letterChars = "abcdefghijklmnopqrstuuwxyz";
const monsterChars = "e";
const obsticleChars = "#~X";
const portalChars = "o&";

const pickBombSprite: SpritePicker = c => {
    const index = bombChars.indexOf(c);
    if (index === -1) {
        return undefined;
    }
    return 8 + index;
};

var randomFlatlandIndex = 0;
const pickFlatlandSprite: SpritePicker = c => {
    const monsterOrPlayerIndex = (orientationChars + monsterChars).indexOf(c)
    if (c === '.' || monsterOrPlayerIndex != -1) {
        return randomFlatlandIndex++ % 2;
    }
    return undefined;
};

const pickObsticleSprite: SpritePicker = c => {
    const index = obsticleChars.indexOf(c);
    if (index === -1) {
        return undefined;
    }
    return 2 + index; 
};

const pickPlayerSpriteStart: SpritePicker = c => {
    const index = playerChars.indexOf(c);
    if (index === -1) {
        return undefined;
    }
    return 48 + index * 4;
};

const pickPowerUpSprite: SpritePicker = c => {
    if (c === '+') {
        return 113;
    }
    return undefined;
};

const pickMonsterSprite: SpritePicker = c => {
    if (c === 'e') {
        return 112;
    }
    return undefined;
}

const pickLetterSprite: SpritePicker = c => {
    const index = letterChars.indexOf(c);
    if(index === -1) {
        return undefined;
    }
    return 17 + index;
}

const pickPortalSprite: SpritePicker = c => {
    if (portalChars.indexOf(c) === -1) {
        return undefined;
    }
    return 6;
}

const pickGemSprite: SpritePicker = c => {
    if (c === '@') {
        return 5;
    }
    return undefined;
};

const pickSnakeTailSprite: SpritePicker = c => {
    if (c === '*') {
        return 7;
    }
    return undefined;
};


export const defaultWorldSpritePicker: SpritePicker = c => {
    return pickFlatlandSprite(c) || 
        pickObsticleSprite(c) || 
        pickPortalSprite(c) || 
        pickLetterSprite(c) || 
        pickGemSprite(c) || 
        pickSnakeTailSprite (c)
};

export const hordWorldSpritePicker: SpritePicker = c => {
    return pickMonsterSprite(c) || pickPowerUpSprite(c) || defaultWorldSpritePicker(c);
}

export const bombWorldSpritePicker: SpritePicker = c => {
    return pickBombSprite(c) || pickPowerUpSprite(c) || defaultWorldSpritePicker(c);
}
