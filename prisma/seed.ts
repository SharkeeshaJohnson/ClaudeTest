import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create AI Journey Account
  const aiJourneyAccount = await prisma.account.upsert({
    where: { id: "ai-journey-account" },
    update: {},
    create: {
      id: "ai-journey-account",
      name: "AI Journey",
      type: "ai_journey",
      platforms: ["tiktok", "instagram"],
      nicheKeywords: [
        "AI",
        "vibe coding",
        "no-code",
        "coding with AI",
        "beginner programmer",
        "tech journey",
      ],
    },
  });

  // Create Dog Content Account
  const dogContentAccount = await prisma.account.upsert({
    where: { id: "dog-content-account" },
    update: {},
    create: {
      id: "dog-content-account",
      name: "Dog Content",
      type: "dog_content",
      platforms: ["tiktok", "instagram"],
      nicheKeywords: [
        "dogs",
        "pets",
        "funny dogs",
        "cute puppies",
        "pet content",
        "viral pets",
      ],
    },
  });

  // Create streaks for accounts
  await prisma.streak.upsert({
    where: { accountId: aiJourneyAccount.id },
    update: {},
    create: {
      accountId: aiJourneyAccount.id,
      currentStreak: 0,
      longestStreak: 0,
      totalXP: 0,
    },
  });

  await prisma.streak.upsert({
    where: { accountId: dogContentAccount.id },
    update: {},
    create: {
      accountId: dogContentAccount.id,
      currentStreak: 0,
      longestStreak: 0,
      totalXP: 0,
    },
  });

  console.log("Seed completed!");
  console.log("Created accounts:", {
    aiJourney: aiJourneyAccount,
    dogContent: dogContentAccount,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
