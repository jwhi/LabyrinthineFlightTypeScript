# LabyrinthineFlight

Re-writing the game to use Typescript and adding new features.

Idea for gameplay right now is traditional roguelike with job system. Players gain skills as they level jobs that can be used while using a different job with seperate abilities to provide the player with different combinations and building a character in a fun way. When you die, you return to the town magically, but you have forgotten all your progress (or a majority of progress) for the currently selected job. Player would not lose skills learned in previous runs and selected jobs. Want to have roguelike permadeath feel and pressure, but also want to give the player a fun way to create characters, progress, and experience the world.

Key to ASCII tiles being used for maps and used to assign sprites.

| Non-walkable. Blocks light. |                   | Non-walkable. Light passes. |                 | Walkable. Blocks light. |             | Walkable. Light passes. |                       |
|-----------------------------|-------------------|-----------------------------|-----------------|-------------------------|-------------|-------------------------|-----------------------|
| **Symbol**                      | *Meaning*           | **Symbol**                      | *Meaning*         | **Symbol**                  | *Meaning*     | **Symbol**                  | *Meaning*               |
| #                           | Room Wall         | Æ                           | Chest           | +                       | Closed Door |                         | Generic Walkable Tile |
| &                           | Hallway Wall      | æ                           | Opened Chest    | ⌠                       | Bush        | .                       | Room Floor            |
| %                           | Cave Wall         | µ                           | Sign            |                         |             | ,                       | Hallway Floor         |
| ♠                           | Tree              | ╤                           | Table           |                         |             | `                       | Cave Floor            |
| ƒ                           | Tree Trunk        | ☼                           | Fire            |                         |             | "                       | path                  |
| ╬                           | Furniture         | :                           | Pile of rubble  |                         |             | -                       | Open Door             |
| ☺                           | NPC with Dialogue | Φ                           | Lights          |                         |             | <                       | Stairs Up             |
| ☻                           | Generic NPC       | ═                           | Bookcase        |                         |             | >                       | Stairs Down           |
|                             |                   | ≈                           | Deep Water      |                         |             | Θ                       | Bed                   |
|                             |                   | ║                           | Fence           |                         |             | ╥                       | Chair                 |
|                             |                   | ♀                           | Grave           |                         |             | ~                       | Water                 |
|                             |                   | ¶                           | Book            |                         |             | ╣                       | Gate                  |
|                             |                   | ₧                           | Opened Book     |                         |             | ╠                       | Opened Gate           |
|                             |                   | ╦                           | Small Furniture |                         |             | ⌡                       | Dead Bush             |
|                             |                   | Ω                           | Skull           |                         |             | ⁿ                       | Plant                 |
|                             |                   |                             |                 |                         |             | ░                       | Crops                 |