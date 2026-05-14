---
name: Meta Lab
description: Self-hosted social media scheduling dashboard
register: product
theme: light
style: Tailscale reference

colors:
  canvas-white: "#ffffff"
  surface-frost: "#f7f5f4"
  canvas-pale: "#eeebea"
  graphite-black: "#181717"
  storm-gray: "#2e2d2d"
  stone-gray: "#575555"
  smoke-gray: "#706e6d"
  cloud-mist: "#d5d3d2"
  border-light: "#232222"
  action-red: "#d04841"
  action-blue-gradient: "linear-gradient(in oklab, rgb(90, 130, 222) 0px, rgb(50, 73, 148) 100%)"

typography:
  primary:
    fontFamily: "Inter, system-ui, sans-serif"
    weights: [300, 400, 500, 600]
  mono:
    fontFamily: "MDIO, system-ui, monospace"
    weights: [500]
  scale:
    caption: 12px
    body-sm: 14px
    body: 16px
    subheading: 20px
    heading: 32px
    heading-lg: 48px
    display: 64px
  line-height:
    caption: 1.5
    body-sm: 1.5
    body: 1.5
    subheading: 1.5
    heading: 1.2
    heading-lg: 1.2
    display: 1.2
  letter-spacing:
    caption: -0.36px
    body-sm: -0.42px
    body: -0.48px
    subheading: -0.6px
    heading: -0.96px
    heading-lg: -1.44px
    display: -1.92px

spacing:
  unit: 4px
  scale: [4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px, 64px, 84px, 168px]

radius:
  tags: 9999px
  cards: 16px
  buttons: 8px
  large-elements: 32px

shadows:
  sm: "rgba(24, 23, 23, 0.02) 0px 4px 8px 0px"
  md: "rgba(24, 23, 23, 0.16) 0px 4px 16px 0px"
---

# Design System — Meta Lab (Tailscale Style Reference)

## Overview

Cloud control panel on pristine paper. The interface is bright, quiet, and enterprise-focused, with soft elevation, crisp typography, and a single confident red accent for primary actions. The system is functional, spacious, and efficient, with minimal decoration.

## Core Tokens

### Colors

- Canvas White: #ffffff
- Surface Frost: #f7f5f4
- Canvas Pale: #eeebea
- Graphite Black: #181717
- Storm Gray: #2e2d2d
- Stone Gray: #575555
- Smoke Gray: #706e6d
- Cloud Mist: #d5d3d2
- Border Light: #232222
- Action Red: #d04841
- Action Blue Gradient: linear-gradient(in oklab, rgb(90, 130, 222) 0px, rgb(50, 73, 148) 100%)

### Typography

- Primary: Inter (300, 400, 500, 600)
- Mono: MDIO (500)

Type scale:
- caption: 12px / 1.5 / -0.36px
- body-sm: 14px / 1.5 / -0.42px
- body: 16px / 1.5 / -0.48px
- subheading: 20px / 1.5 / -0.6px
- heading: 32px / 1.2 / -0.96px
- heading-lg: 48px / 1.2 / -1.44px
- display: 64px / 1.2 / -1.92px

### Spacing + Shapes

- Base unit: 4px
- Card padding: 24px
- Element gap: 12px
- Radii: cards 16px, buttons 8px, tags 9999px, large elements 32px

### Shadows

- sm: rgba(24, 23, 23, 0.02) 0px 4px 8px 0px
- md: rgba(24, 23, 23, 0.16) 0px 4px 16px 0px

## Components

### Primary Filled Button

- Background: Action Red
- Text: Canvas White
- Radius: 8px
- Padding: 10px vertical, 12px horizontal

### Neutral Ghost Button

- Background: transparent
- Text: Graphite Black
- Border: 1px solid Graphite Black
- Radius: 8px
- Padding: 10px vertical, 12px horizontal

### Secondary Ghost Button

- Background: transparent
- Text: Storm Gray
- Border: 1px solid Canvas Pale
- Radius: 16px
- Padding: 24px

### Status Tag

- Background: Canvas White
- Text: Storm Gray
- Border: 1px solid Canvas Pale
- Radius: 9999px
- Padding: 0px vertical, 18px horizontal

### Feature Card

- Background: Canvas White
- Radius: 16px
- Shadow: sm
- Padding: 32px

### Large Feature Card

- Background: Canvas White
- Radius: 32px
- Shadow: sm
- Padding: 64px

### Dark Content Panel

- Background: Storm Gray
- Radius: 32px
- Padding: 64px vertical, 48px horizontal

## Do

- Use Inter for UI text, MDIO for mono labels.
- Use Graphite Black for primary text and Storm Gray for secondary text.
- Use Canvas Pale for page backgrounds, Canvas White for cards.
- Use Action Red only for primary actions and explicit active states.
- Use the soft shadow sm for card elevation.
- Use 16px card radius and 8px button radius.

## Do Not

- Do not introduce new vibrant colors beyond Action Red or Action Blue Gradient.
- Do not use heavy or stacked shadows.
- Do not apply gradient text.
- Do not use dark panels unless they serve a contained, explicit purpose.
