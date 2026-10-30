# Mini Mart Farm — Three.js Game Development Brief

## 1. Project Overview

Build a mobile-first 3D browser game inspired by **My Mini Mart**, using Three.js and TypeScript.

The game should recreate the enjoyable core loop of farming, harvesting crops, transporting produce, stocking a mini-mart, serving customers, hiring workers, earning money, and expanding the business.

The game should be visually similar in overall gameplay, camera perspective, character scale, and environment design to the supplied My Mini Mart screenshots, while using original or properly licensed 3D assets.

### Primary objectives

- Smooth gameplay on mobile phones.
- A zoomed-out camera at approximately 60 degrees.
- A brown-skinned farmer wearing a straw farm hat.
- Interactive crop plots and farm activities.
- A shop the player can physically enter.
- Easy shelf stocking and product placement.
- A checkout counter where the player can hire a seller.
- Customers who purchase stocked products.
- Progressive farm and shop expansion.

## 2. Technology Stack

- Three.js — 3D rendering and scene management.
- TypeScript — game logic and type safety.
- Vite — development server and production build.
- React — optional UI framework for HUD and menus.
- React Three Fiber — optional integration if React-based 3D components are preferred.
- Zustand — shared game state.
- IndexedDB or localStorage — local save system.

Do not add a backend until the core gameplay loop works reliably.

## 3. Screenshot Reference Instructions

I will provide screenshots of the original My Mini Mart game.

Before implementing the game, inspect the screenshots and identify:

- Camera angle and zoom.
- Character proportions and movement scale.
- Farm plot arrangement.
- Shop exterior and interior.
- Shelf placement and product arrangement.
- Checkout counter and seller location.
- User interface layout.
- Interaction buttons and visual feedback.
- Colors, lighting, and overall art style.

Use the screenshots as visual references throughout implementation.

Do not simply display screenshots as the game environment. Recreate the world using real 3D objects and interactive systems.

Do not claim to have inspected screenshots that have not been supplied.

## 4. Camera and World Design

Use an elevated isometric or three-quarter camera approximately 60 degrees above the ground plane.

The camera must be zoomed out enough to show more of the environment at once.

Requirements:

- Smoothly follow the player.
- Keep the farmer visible during movement.
- Show useful portions of the farm and shop.
- Adapt to portrait and landscape screens.
- Avoid excessive perspective distortion.
- Use camera interpolation to prevent abrupt movement.
- Adjust the camera when the player enters the shop.
- Prevent the shop roof from hiding the player or shelves.

Consider an orthographic camera for a stable isometric appearance, with camera zoom adjusted to the device's screen size.

## 5. Character and Controls

The main character must be brown-skinned and wear a straw farm hat.

The character should have a recognizable body, clothing, legs, arms, and walking animation.

### Mobile controls

Implement a virtual joystick on the lower-left side of the screen.

Place action buttons on the lower-right side.

The player should be able to:

- Walk around the farm.
- Approach crops.
- Plant and harvest produce.
- Carry goods.
- Enter and leave the shop.
- Stock shelves.
- Hire workers.
- Interact with objects.

Use generous interaction ranges so mobile players do not need to tap tiny targets.

Support keyboard controls during desktop development.

## 6. Farming System

Farming should be central to the game.

Implement:

- Crop plots.
- Seed planting.
- Visible growth stages.
- Harvesting.
- Inventory management.
- Produce storage.
- Additional land unlocked with coins.

Start with tomatoes, carrots, and corn.

Each crop should have a growth duration, seed cost, harvest yield, and selling price.

Crop growth must depend on simulation time rather than rendering frame count.

Later, add watering, fertilizer, irrigation, livestock, and crop-processing stations.

## 7. Enterable Mini-Mart

The mini-mart must be a genuinely navigable shop.

The player should walk through the entrance and move around inside the building.

The interior must contain:

- Shelves.
- Products.
- A checkout counter.
- A designated seller position.
- Space for customers to enter and move around.

Implement collision boundaries for walls, shelves, and counters while keeping the entrance accessible.

When the player enters, hide or fade the roof and any walls that obstruct the camera. The interior must remain visible from the elevated camera angle.

Provide a clear exit point.

## 8. Product Placement and Shelf Stocking

Shelf stocking must be simple and intuitive.

When the player approaches a shelf carrying produce:

1. Display a stocking prompt.
2. Allow the player to tap an action button.
3. Transfer products from inventory to the shelf.
4. Display the products visibly on the shelf.
5. Update inventory and shelf capacity.

Prevent stocking if the player has no produce or the shelf is full.

Shelves should support different product types and have configurable capacities.

The shop must sell only products that are actually stocked.

## 9. Hiring a Seller

Allow the player to hire a seller at the checkout counter.

The hiring process should:

1. Display the hiring cost.
2. Check whether the player has enough coins.
3. Deduct the cost.
4. Spawn a seller behind the counter.
5. Save the hired state.

Hiring must eventually provide real gameplay value.

The seller should automatically handle checkout while the player continues farming.

## 10. Customer System

Customers should enter the shop when products are available.

Implement a lightweight state machine:

- Entering the shop.
- Browsing shelves.
- Selecting available products.
- Moving to the checkout counter.
- Completing a purchase.
- Leaving the shop.

When a customer purchases an item, reduce shelf stock and increase the player's money.

Customers must not purchase unavailable products.

The hired seller should automate checkout and process sales without requiring the player to remain at the counter.

## 11. Economy and Progression

Implement a central game state for:

- Coins.
- Seeds.
- Harvested produce.
- Stored inventory.
- Shelf inventory.
- Customer purchases.
- Hired staff.
- Farm plots.
- Shop upgrades.

Use coins to unlock new plots, seeds, products, equipment, and buildings.

Make progress visible through animations, UI feedback, and changes to the world.

## 12. Mobile Performance

Mobile performance is a core requirement.

- Target approximately 30–60 FPS, depending on the device.
- Cap pixel ratio on mobile.
- Reuse geometries and materials.
- Use instancing for repeated crops and environmental objects.
- Keep texture sizes small.
- Limit expensive real-time shadows.
- Avoid unnecessary allocations in the render loop.
- Use delta time for movement and simulation.
- Load additional content when needed.
- Dispose of unused GPU resources.
- Test on actual Android and iPhone devices.

Do not assume that a game performing well on a desktop will perform equally well on a phone.

## 13. Suggested Project Structure

```text
src/
  main.ts
  game/
    Game.ts
    SceneSetup.ts
    CameraController.ts
    PlayerController.ts
    InteractionSystem.ts
    CollisionWorld.ts
  systems/
    CropSystem.ts
    InventorySystem.ts
    EconomySystem.ts
    ShopSystem.ts
    CustomerSystem.ts
    StaffSystem.ts
    SaveSystem.ts
  entities/
    Farmer.ts
    CropPlot.ts
    Shelf.ts
    Customer.ts
    Seller.ts
    Building.ts
  data/
    crops.ts
    products.ts
    upgrades.ts
  ui/
    HUD.tsx
    MobileJoystick.tsx
    ActionButton.tsx
    InventoryPanel.tsx
    ShopPanel.tsx
  assets/
    models/
    textures/
    audio/
```

Keep game systems separate so new crops, products, customers, and upgrades can be added without rewriting the entire game.

## 14. Development Milestones

### Milestone 1: 3D foundation

Create the farm, shop exterior, player character, camera, mobile controls, and responsive HUD.

### Milestone 2: Farming

Implement planting, crop growth, harvesting, inventory, and coins.

### Milestone 3: Shop interior

Allow the player to enter the shop, move around, stock shelves, and exit.

### Milestone 4: Seller and customers

Implement hiring, customer purchases, automatic checkout, and revenue.

### Milestone 5: Progression and polish

Add save data, upgrades, animations, sound effects, additional crops, and performance improvements.

## 15. Definition of Done

The first playable version is complete when a mobile player can:

- Move around the farm smoothly.
- Plant and harvest crops.
- Collect produce.
- Walk into the mini-mart.
- Move around inside.
- Place products on shelves.
- Hire a seller at the counter.
- Watch customers purchase stocked products.
- Earn coins and expand the farm.
- Refresh the browser without losing saved progress.

## 16. Local Development

Use Vite for local development.

```bash
npm install
npm run dev -- --host 0.0.0.0
```

Open the local URL in a desktop browser.

To test on a phone, use the network URL printed by Vite while the phone and development computer are connected to the same Wi-Fi network.

For production:

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

## Final Instructions

Read this document before starting implementation.

Inspect the supplied My Mini Mart screenshots and establish the camera, world layout, character scale, UI, and interactions before coding.

Build a playable game in small increments. Test each feature before moving on.

Prioritize mobile usability, camera framing, farming, shop navigation, shelf stocking, and automated sales before adding large amounts of content.
