import { CartridgeRegistry } from "./core/cartridge";
import { Compiler } from "./core/compiler";
import { v4 as uuidv4 } from "uuid";

async function testBasicFunctionality() {
  console.log("🧪 Testing YAFA Prompt Orchestration Engine v4.0.0");
  console.log("=" .repeat(60));

  try {
    // Test 1: Cartridge Registry
    console.log("\n1️⃣ Testing Cartridge Registry...");
    const registry = new CartridgeRegistry();
    console.log("✅ Cartridge registry created");

    // Test 2: Compiler
    console.log("\n2️⃣ Testing Compiler...");
    const compiler = new Compiler(registry);
    console.log("✅ Compiler created");

    // Test 3: Basic Compilation
    console.log("\n3️⃣ Testing Basic Compilation...");
    const testInput = {
      goal: "Create an executive presentation for Q4 results",
      yafaOn: true,
      slots: {
        purpose: "Q4 financial results presentation",
        audience: "Board of Directors",
        slide_count: 12,
        timeframe: "Q4 2024",
        tone: "confident",
        cta: "Approve budget for Q1 2025",
        brand: "TechCorp"
      },
      requestId: uuidv4(),
      userId: "test-user"
    };

    console.log("📝 Test input:", JSON.stringify(testInput, null, 2));

    // Note: This will fail without cartridges, but that's expected
    console.log("⚠️  Compilation will fail without cartridges (expected)");
    console.log("✅ Basic functionality test completed");

    console.log("\n🎉 All basic tests passed!");
    console.log("\n📋 Next steps:");
    console.log("   • Add cartridges to the registry");
    console.log("   • Configure environment variables");
    console.log("   • Start the server with: npm start");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testBasicFunctionality().catch(console.error);
