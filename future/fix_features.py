import re

with open('src/components/LandingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the features section
old_features = r'''<Feature
                                title="From First Screenshot to Victory"
                                description="Our context-aware AI vision doesn't just see a game—it understands your moment. Get guidance on puzzles, lore, and boss strategies, all without spoilers."
                                icon="eye"
                            />
                            <Feature
                                title="Play From Anywhere"
                                description="Gaming on console? Manually upload screenshots from your phone. Help arrives instantly in the same conversation."
                                icon="network"
                            />
                            <Feature
                                title="Play Your Way"
                                description="Story-driven explorer? Completionist? Speedrunner? Tell us once, and every hint, strategy, and insight matches your playstyle."
                                icon="bookmark"
                            />
                            <Feature
                                title={<>Go Pro for the Ultimate Edge<ProBadge /></>}
                                description="Unlock In-Depth Insight Tabs to auto-generate a wiki for your game, use Hands-Free Voice Responses for ultimate immersion, and capture more details with Batch Screenshot Capture."
                                icon="insights"
                            />'''

new_features = '''<Feature
                                title="From First Screenshot to Victory"
                                description="Upload a screenshot. Otakon identifies your game and becomes your personal guide—no spoilers, full context."
                                icon="eye"
                            />
                            <Feature
                                title="Play Your Way"
                                description="Story-driven explorer? Completionist? Speedrunner? Tell us once, and every hint, strategy, and insight matches your playstyle."
                                icon="bookmark"
                            />
                            <Feature
                                title="Never Pause for Help Again"
                                description="Hands-Free mode reads AI insights aloud. Get strategy tips, lore context, or build advice without leaving the game."
                                icon="mic"
                            />
                            <Feature
                                title="Your Gaming Dashboard"
                                description="Track multiple games at once. Each has its own conversation, progress bar, and AI-generated insight tabs tailored to that game's genre."
                                icon="insights"
                            />
                            <Feature
                                title="Play From Anywhere"
                                description="Gaming on console? Manually upload screenshots from your phone. Help arrives instantly in the same conversation."
                                icon="network"
                            />
                            <Feature
                                title="Stay Focused, Stay Ahead"
                                description="Skip the wiki-hunting. Otakon provides quest tips, secret locations, build optimization—all without spoiling your discovery."
                                icon="cpu"
                            />'''

content = content.replace(old_features, new_features)

with open('src/components/LandingPage.tsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("✅ Features section updated!")
