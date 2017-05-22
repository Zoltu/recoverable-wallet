port module App exposing (..)

import Html exposing (Html, button, div, text, program)
import Html.Attributes exposing(..)
import Html.Events exposing (onClick)


-- Types

type alias Address = String
type alias Amount = Int
type alias Model = { address: Maybe Address, eth: Amount }
type Message = AddressChanged String | RefreshAddress

-- PORTS

port requestAddress: () -> Cmd message
port requestWallet: Address -> Cmd message
port requestCreateWalletGasEstimate: Address -> Cmd message
port requestSendEthGasEstimate: (Address, Amount, Address) -> Cmd message
port createWallet: (Address, Amount, Int) -> Cmd message
port sendEth: (Address, Amount, Address) -> Cmd message

port addressChanged: (Address -> message) -> Sub message
port walletChanged: (Address -> message) -> Sub message
port createWalletGasEstimate: (Amount -> message) -> Sub message
port sendEthGasEstimate: (Amount -> message) -> Sub message


-- UPDATE

update: Message -> Model -> (Model, Cmd Message)
update message model = case message of
    AddressChanged newAddress -> ({model | address = Just newAddress }, Cmd.none)
    RefreshAddress -> (model, requestAddress ())


-- SUBSCRIPTIONS

subscriptions: Model -> Sub Message
subscriptions model = addressChanged AddressChanged


-- VIEW

renderModel: Model -> Html Message
renderModel model =
    div [ class "wallet" ] [
        div [ class "address" ] [
            div [ class "label" ] [ text "Address" ],
            div [] [
                button [ class "fa fa-refresh", onClick RefreshAddress ] [],
                div [ class "value" ] [ text (maybeString model.address) ]
            ]
        ]
    ]

maybeString: Maybe String -> String
maybeString x = case x of
    Nothing -> "No Address Available"
    Just y -> y


-- MAIN

main: Program Never Model Message
main =
    program {
        init = ({ address = Nothing, eth = 0 }, requestAddress ()),
        view = renderModel,
        update = update,
        subscriptions = subscriptions
    }
