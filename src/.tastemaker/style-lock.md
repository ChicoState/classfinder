# ClassFinder interface

Direction: old-school grey utility site for the frontpage, with flat panels, beveled controls, hard borders, and compact early-web typography.
First viewport: compact wordmark, large serif title, and a framed interactive campus map.
System: existing React, Leaflet, native controls and CSS. No new dependencies. Home styles are scoped to `.home-shell` and `.home-page` so building pages retain their current presentation.
Palette: background #c8c8c8, panel #dcdcdc, light #f4f4f4, mid #969696, dark #3e3e3e, ink #1d1d1d.
Typography: Arial/Helvetica for utility text, Georgia/Times New Roman for the home title, Courier New for labels and status text.
Spacing: 8, 12, 16, 20px. Radius: 0px on home panels, map, controls, and popups.
Assets: existing map tiles and floor plans; existing wordmark preserved. No decorative photography needed.
Motion: the frontpage uses the map's existing interaction behavior plus a two-second stepped blue loading bar when a building is selected. The loader is deliberately low-frequency and includes reduced-motion handling.
References: user direction for an old-school grey website with blocky buttons. Original interface composition, no copied assets.
Scope: home, campus map, indoor routing controls, floor tabs, status and unavailable states. Existing handlers, routes and route calculation preserved.
Review: pending user feedback. Supporting tastemaker references/scripts were absent in this installation; automated tastemaker scans unavailable.
