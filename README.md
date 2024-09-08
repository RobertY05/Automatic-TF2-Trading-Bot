# Automatic TF2 Trading Bot

![image](https://github.com/user-attachments/assets/a2fbc5ae-636b-4c4f-9516-edc5825cdad8)

A bot that automatically trades TF2 items for profit.

## Background
*Feel free to skip if you do not wish to learn about the mechanics of Team Fortress 2 hat trading.*
In *Team Fortress 2* you can earn in-game cosmetic items (referred to as hats) through a number of different methods: time played, achievements, and gambling. 
Most of the higher quality hats that are worth monetary value are unlocked by gambling.
In the game, you can buy a Mann Co. Supply Crate Key (simply referred to as "key" or "keys") to unlock crates for a chance to win a rare hat.
But what if you didn't want to gamble for a an exccedingly rare hat?
Thankfully, you don't have to, assuming that someone else owns that item and is willing to sell it, you can offer to buy it off them using the Steam trading feature!
Naturally, you can offer to pay them a certain number of keys for the hat, based on how rare it was, and how good it looks.
The only question is, how much should you buy the hat for, and how much should they sell the hat for.

## Strategy
This bot uses a quanitity over quality approach to trading. Many lower tier hats already have bots willing to automatically buy it at a certain price.
We can use that as a "true price" or "price floor." While human traders may hold certain hats at a higher or lower value, the bot only cares about the "true price."
The bot will start by making a trade which looks like:

```
items bot gives:
bot's hat
X amount of keys

items trader gives:
trader's hat
Y amount of keys
```

where the bot will choose X and Y to ensure that if the trader accepts this trade the bot will always be "profiting" assuming that both hats are at exactly the "price floor."
The philosophy is that by sending out enough trades eventually someone will find this offer appealing.

## Implementation
The bot's logic loop looks roughly like the diagram below:

![TF2 Bot Logic Loop](https://github.com/user-attachments/assets/afc3c348-955c-412a-a139-c438c0aba0b7)

There are small details of implementation, such as what if offers are accepted during the process and what if irregular items are sent as part of counter-offers, but they are not included in this high-level diagram.
