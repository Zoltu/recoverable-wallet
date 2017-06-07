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
    , wallet : Maybe Address
    , eth : Maybe Amount
    }


type Message
    = AddressChanged Address
    | WalletChanged Address
    | RefreshAddress
    | RequestWallet



-- PORTS


port requestAddress : () -> Cmd message


port requestWallet : Address -> Cmd message


port requestTokenList : () -> Cmd message


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
            ( { initialModel | address = Just newAddress }, Cmd.none )

        WalletChanged newWallet ->
            ( { model | wallet = Just newWallet, eth = Nothing }, Cmd.none )

        RefreshAddress ->
            ( model, requestAddress () )

        RequestWallet ->
            case model.address of
                Nothing ->
                    ( model, Cmd.none )

                Just address ->
                    ( model, requestWallet address )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Message
subscriptions model =
    Sub.batch
        [ addressChanged AddressChanged
        , walletChanged WalletChanged
        ]



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
        , viewWallet model
        ]


showAddress : Maybe Address -> String
showAddress address =
    address
        |> withDefault "No Address Available"


viewWallet : Model -> Html Message
viewWallet model =
    let
        walletDiv =
            case model.wallet of
                Nothing ->
                    div []
                        [ button [ onClick RequestWallet ] [ text "RequestWallet" ]
                        ]

                Just wallet ->
                    div []
                        [ div [ class "value" ] [ text <| wallet ]
                        ]
    in
        div []
            [ div [ class "label" ] [ text "Wallet" ]
            , walletDiv
            ]


initialModel : Model
initialModel =
    { address = Nothing
    , wallet = Nothing
    , eth = Nothing
    }


main : Program Never Model Message
main =
    program
        { init = ( initialModel, requestAddress () )
        , view = view
        , update = update
        , subscriptions = subscriptions
        }
