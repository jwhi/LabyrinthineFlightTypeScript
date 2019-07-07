# LabyrinthineFlight

Re-writing the game to use Typescript and adding new features.

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
|                             |                   |                             |                 |                         |             | ⌡                       | Dead Bush             |
|                             |                   |                             |                 |                         |             | ⁿ                       | Plant                 |
|                             |                   |                             |                 |                         |             | ░                       | Crops                 |