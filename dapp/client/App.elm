port module App exposing (..)

import Html exposing (Html, button, div, text, program)
import Html.Attributes exposing (..)
import Html.Events exposing (onClick)
import Maybe exposing (withDefault)


type alias Address =
    String


type alias Amount =
    Int


type alias Model =
    { address : Maybe Address
    , eth : Amount
    }


type Message
    = AddressChanged String
    | RefreshAddress



-- PORTS


port requestAddress : () -> Cmd message


port requestWallet : Address -> Cmd message


port requestCreateWalletGasEstimate : Address -> Cmd message


port requestSendEthGasEstimate : ( Address, Amount, Address ) -> Cmd message


port createWallet : ( Address, Amount, Int ) -> Cmd message


port sendEth : ( Address, Amount, Address ) -> Cmd message


port addressChanged : (Address -> message) -> Sub message


port walletChanged : (Address -> message) -> Sub message


port createWalletGasEstimate : (Amount -> message) -> Sub message


port sendEthGasEstimate : (Amount -> message) -> Sub message



-- UPDATE


update : Message -> Model -> ( Model, Cmd Message )
update message model =
    case message of
        AddressChanged newAddress ->
            ( { model | address = Just newAddress }, Cmd.none )

        RefreshAddress ->
            ( model, requestAddress () )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Message
subscriptions model =
    addressChanged AddressChanged



-- VIEW


view : Model -> Html Message
view model =
    div [ class "wallet" ]
        [ div [ class "address" ]
            [ div [ class "label" ] [ text "Address" ]
            , div []
                [ button [ class "fa fa-refresh", onClick RefreshAddress ] []
                , div [ class "value" ] [ text <| showAddress model.address ]
                ]
            ]
        ]


showAddress : Maybe Address -> String
showAddress x =
    withDefault "No Address Available" x


main : Program Never Model Message
main =
    program
        { init = ( { address = Nothing, eth = 0 }, requestAddress () )
        , view = view
        , update = update
        , subscriptions = subscriptions
        }
