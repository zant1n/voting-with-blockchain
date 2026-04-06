#!/bin/bash

echo "🎨 Generating Disney profile pictures for candidates..."

# Create images directory
mkdir -p public/images

# Generate Cinderella (Candidate 0)
cat > public/images/candidate0.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs><linearGradient id="g0" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#4A90E2"/><stop offset="100%" style="stop-color:#357ABD"/></linearGradient></defs>
  <circle cx="100" cy="100" r="100" fill="url(#g0)"/>
  <circle cx="100" cy="75" r="35" fill="#FFD700"/>
  <text x="100" y="85" text-anchor="middle" fill="#4A90E2" font-size="40">👸</text>
</svg>
EOF

# Generate Prince Charming (Candidate 1)
cat > public/images/candidate1.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#DAA520"/><stop offset="100%" style="stop-color:#B8860B"/></linearGradient></defs>
  <circle cx="100" cy="100" r="100" fill="url(#g1)"/>
  <circle cx="100" cy="75" r="35" fill="#4169E1"/>
  <text x="100" y="85" text-anchor="middle" fill="#DAA520" font-size="40">🤴</text>
</svg>
EOF

# Generate Belle (Candidate 2)
cat > public/images/candidate2.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFD700"/><stop offset="100%" style="stop-color:#FFA500"/></linearGradient></defs>
  <circle cx="100" cy="100" r="100" fill="url(#g2)"/>
  <circle cx="100" cy="75" r="35" fill="#FF69B4"/>
  <text x="100" y="85" text-anchor="middle" fill="#FFD700" font-size="40">👸</text>
</svg>
EOF

# Generate Aladdin (Candidate 3)
cat > public/images/candidate3.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#9370DB"/><stop offset="100%" style="stop-color:#7B68EE"/></linearGradient></defs>
  <circle cx="100" cy="100" r="100" fill="url(#g3)"/>
  <circle cx="100" cy="75" r="35" fill="#FFD700"/>
  <text x="100" y="85" text-anchor="middle" fill="#9370DB" font-size="40">🧞</text>
</svg>
EOF

# Generate Default Avatar
cat > public/images/default.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs><linearGradient id="gd" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#6B7280"/><stop offset="100%" style="stop-color:#4B5563"/></linearGradient></defs>
  <circle cx="100" cy="100" r="100" fill="url(#gd)"/>
  <circle cx="100" cy="75" r="35" fill="#9CA3AF"/>
  <text x="100" y="85" text-anchor="middle" fill="#6B7280" font-size="40">🗳️</text>
</svg>
EOF

echo "✅ All images generated successfully!"
ls -la public/images/
