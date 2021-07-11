class Interactable {
    name: string;
    interacted: boolean = false;
    description: string = "";
}

class Sign extends Interactable {
    text: string = "";
    constructor() {
        super();
    }
}

class Book extends Interactable {
    title: string = "";
    author: string = "";
    contents: Object;
    constructor() {
        super();
    }
}

class Door extends Interactable {
    locked: boolean = false;
}

export { Sign, Book, Door }
