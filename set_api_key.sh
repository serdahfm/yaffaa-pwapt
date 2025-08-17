#!/bin/bash

echo "🔑 OpenAI API Key Setup"
echo "========================"
echo ""
echo "Please enter your OpenAI API key (it will be hidden as you type):"
echo "Format: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo ""

# Read the API key without displaying it
read -s OPENAI_API_KEY

echo ""
echo ""

# Validate the key format
if [[ $OPENAI_API_KEY =~ ^sk-[a-zA-Z0-9]{32,}$ ]]; then
    echo "✅ Valid API key format detected"
    
    # Update the .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/OPENAI_API_KEY=sk-.*/OPENAI_API_KEY=$OPENAI_API_KEY/" .env
    else
        # Linux
        sed -i "s/OPENAI_API_KEY=sk-.*/OPENAI_API_KEY=$OPENAI_API_KEY/" .env
    fi
    
    echo "✅ API key saved to .env file"
    echo ""
    echo "🔍 Verifying .env file:"
    echo "   OPENAI_API_KEY=$(grep "OPENAI_API_KEY=" .env | cut -d'=' -f2 | cut -c1-10)..."
    echo ""
    echo "🚀 You can now restart your server and test the UPE system!"
    echo "   Run: source .venv/bin/activate && python main_simple.py"
    
else
    echo "❌ Invalid API key format. Please ensure it starts with 'sk-' and is the correct length."
    echo "   Example: sk-1234567890abcdef1234567890abcdef1234567890abcdef"
fi
