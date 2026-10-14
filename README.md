# Cuboid net renderer

- Deployed at: <https://darrell-newman.github.io/cuboid-net-renderer/>

A tool for verifying and rendering polyomino nets that fold into cuboids.

The UI includes some nets as presets. These nets consist of 106 squares and fold into 3 distinct cuboids.

## References:

- https://www.jaist.ac.jp/~uehara/etc/origami/nets/index-e.html - Solutions for 22 squares and 2 cuboids
- https://youtu.be/jOTTZtVPrgo - Stand-up Maths video - Dec 3 2022
- https://arxiv.org/abs/2608.19910 - Paper announcing solutions for 106 squares - Aug 2026
- https://youtu.be/RAexoVJOqDQ - Stand-up Maths video - Aug 21 2026

## Net format

Nets are represented using an 'ASCII art' representation. For example, a 1x1x1 cube could be represented like this:

```
.#.
###
.#.
.#.
```

The `#` signifies a square in the net and `.` is used as a placeholder.

## Solution presets

The presets include all solutions known to me for 106 squares. I am not aware of any solutions with fewer squares.

I've grouped similar solutions together. Some of the terminology is my own, so I've outlined some rough definitions below. As more solutions are discovered the groupings may need to change and some of these terms may not survive. Spotting patterns in a small data set is easy and those patterns might not be indicative of anything deeper than coincidence or an artifact of the search strategy used to find solutions.

The 15 stacked solutions and 25 simple-phase net (SPN) solutions are discussed in the paper linked above. These were the first solutions found for 106 squares. They take advantage of the geometry of the 26x1x1 cuboid, which tends to unfold into bands of 4, with single squares on the ends.

### Stacked nets

This is an example stacked net for a 5x1x1 cuboid:

```
       ...#...
       .#.#.#.
end -> ######.
       .###### <- end
       .##.##.
       ..#.#..
        ^^^^^
        bands
         of
        four
```

There are 5 vertical bands of 4 and then 2 individual squares on either end.

Any net following this structure will fold into an Nx1x1 cuboid. This doesn't guarantee it'll fold into two other cuboids, but it does dramatically speed up a computer search to focus on nets like these.

For 106 squares, all stacked solutions have been found. There are 15 of them.

### Simple-phase nets (SPNs)

Simple-phase nets are a similar idea, but the 4 squares in each band don't necessarily need to be touching each other. Stacked nets are a special case of simple-phase nets.

An Nx1x1 cuboid has 2 end squares, one on each end. If we restrict ourselves to nets where each of those squares are only connected to a single neighbour then all valid nets are simple-phase nets.

For 106 squares, all SPN solutions have been found. There are 40 in total, 15 of which are stacked and 25 are not.

### Tails

If we allow the end squares of the Nx1x1 cuboid to have multiple neighbours then we end up with nets that have 'tails'. There will be a central region that joins the two end squares, with the tail connecting to one of those ends.

Here's an example of a tail for a 5x1x1 net. On the left there isn't a tail, on the right there is:

```
 ends
squares
|     |
v     v
##.#.....
.#####...
.######## <- 2 squares of 'tail' beyond the end square
.#####...
..#......
```

The net above is similar to a stacked net, but with a tail. There are 3 complete bands of 4, but the other two bands are incomplete and only contain 3 squares. These 'missing' squares leave a gap that is filled by folding over the tail.

### Short tails

Several of the solutions in the presets have similar tails consisting of a single square. They tend to follow a specific layout, with a pair of squares connected to a band of 3:

```
      tail -> #.
end square -> ## the rest
              .# of the net
              .# goes here
```

The rest of the net is often in bands of 4, like a stacked net or simple-phase net.

These 'short tails' appear in several of the solutions. If a solution has no other obvious defining feature then it has been listed simply as a 'short tail'. Arguably they should be split into two subgroups, depending on whether the central region is stacked or a simple-phase net.

### Long tails

Currently, there are two known categories of solutions with long tails:

- The 'two-sixer'. This solution is similar to the stacked solutions, but it uses 2-6 stacking rather than 1-4 stacking. This allows it to wrap around the 17x2x1 cuboid in bands. From the perspective of the 17x2x1 cuboid it doesn't have a tail, but I usually define tails relative to the Nx1x1 cuboid, which would be 26x1x1 in this case. From that perspective, it has 2 very long tails. The tails are so long that they actually pass each other in the middle of the cuboid. This solution is rotationally symmetric, which is how I found it.
- V-shaped solutions. These look a bit like a V or checkmark. They have a long tail on one end. At the other end they have either no tail or a short tail. The 12 known V-shaped solutions are all very similar, essentially just shuffling around squares at the edges. They have a core structure of 2 legs with 2:1 gradients, but in different directions, meeting at 90 degrees.
