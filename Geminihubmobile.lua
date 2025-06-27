--[[
    Title: GeminiHub MOBILE (Chat Command Version)
    Game: Pet Simulator 99
    Author: Gemini (for User - Mobile)
    Description: Isang mobile-friendly executor script na gumagamit ng chat commands.
    Date: June 28, 2025
]]

--================================================================
-- INITIALIZATION & VARIABLES
--================================================================
print("GeminiHub Mobile Loaded! Type /help in chat for commands.")

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")
local LocalPlayer = Players.LocalPlayer

-- Variables para i-track ang status ng mga features
local isFarming = false
local isCollectingOrbs = false

-- Prefix para sa mga commands
local prefix = "/"

--================================================================
-- CORE LOGIC FUNCTIONS
--================================================================

-- Auto-Farm Loop (para sa mga chests, vaults, etc.)
function startAutoFarm()
    isFarming = true
    task.spawn(function()
        print("Auto-Farm Started.")
        while isFarming and task.wait(0.5) do
            if not LocalPlayer.Character or not LocalPlayer.Character:FindFirstChild("HumanoidRootPart") then continue end

            local nearestBreakable = nil
            local shortestDistance = 150 -- Maghanap lang sa loob ng 150 studs para hindi masyadong malayo

            for _, v in pairs(Workspace.Breakables:GetChildren()) do
                -- Siguraduhing may "Health" at "Position" ang target
                if v:IsA("Model") and v:FindFirstChild("Health") and v:FindFirstchild("Position") then
                    local distance = (LocalPlayer.Character.HumanoidRootPart.Position - v.Position.Value).Magnitude
                    if distance < shortestDistance then
                        shortestDistance = distance
                        nearestBreakable = v
                    end
                end
            end

            if nearestBreakable then
                LocalPlayer.Character.Humanoid:MoveTo(nearestBreakable.Position.Value)
            end
        end
        print("Auto-Farm Stopped.")
    end)
end

function stopAutoFarm()
    isFarming = false
end

--================================================================
-- CHAT COMMAND HANDLER
--================================================================
LocalPlayer.Chatted:Connect(function(message)
    -- Gawing lowercase ang message para hindi case-sensitive
    local msg = string.lower(message)
    -- Paghiwalayin ang command at ang mga arguments
    local args = msg:split(" ")
    local cmd = args[1]

    -- Tignan kung ang message ay nagsisimula sa ating prefix
    if cmd:sub(1, #prefix) ~= prefix then
        return
    end

    -- Alisin ang prefix sa command
    local commandName = cmd:sub(#prefix + 1)

    -- === COMMANDS LIST ===

    if commandName == "help" then
        print("--- GeminiHub Mobile Commands ---")
        print(prefix .. "autofarm on/off - Starts/stops farming breakables.")
        print(prefix .. "speed <number> - Sets your walkspeed (e.g., /speed 200).")
        print(prefix .. "jump <number> - Sets your jump power (e.g., /jump 150).")
        print(prefix .. "teleport <plaza/lastarea> - Teleports you to a location.")
        print("---------------------------------")

    elseif commandName == "autofarm" then
        local arg = args[2]
        if arg == "on" then
            if isFarming then
                print("Auto-farm is already running.")
            else
                startAutoFarm()
            end
        elseif arg == "off" then
            if not isFarming then
                print("Auto-farm is not running.")
            else
                stopAutoFarm()
            end
        else
            print("Invalid argument. Use: /autofarm on or /autofarm off")
        end

    elseif commandName == "speed" then
        local value = tonumber(args[2])
        if value and LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("Humanoid") then
            LocalPlayer.Character.Humanoid.WalkSpeed = value
            print("WalkSpeed set to " .. value)
        else
            print("Invalid value. Use: /speed <number>")
        end

    elseif commandName == "jump" then
        local value = tonumber(args[2])
        if value and LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("Humanoid") then
            LocalPlayer.Character.Humanoid.JumpPower = value
            print("JumpPower set to " .. value)
        else
            print("Invalid value. Use: /jump <number>")
        end

    elseif commandName == "teleport" then
        local destination = args[2]
        if LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart") then
            if destination == "plaza" then
                LocalPlayer.Character.HumanoidRootPart.CFrame = CFrame.new(Vector3.new(-160, 150, 480)) -- Sample Trading Plaza Coords
                print("Teleported to Trading Plaza.")
            elseif destination == "lastarea" then
                -- Kailangan mong kunin ang coordinates ng last area at ilagay dito
                LocalPlayer.Character.HumanoidRootPart.CFrame = CFrame.new(Vector3.new(1234, 150, 5678)) -- Sample Last Area Coords
                print("Teleported to the Last Area.")
            else
                print("Invalid destination. Use: /teleport <plaza/lastarea>")
            end
        end

    else
        print("Unknown command: " .. commandName .. ". Type /help for a list of commands.")
    end
end)
