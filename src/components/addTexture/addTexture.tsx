import React from 'react'
import { AddIcon } from '@chakra-ui/icons';

export type AddTextureProps = {
    Name: string;
    Map: string | null;
    MapURL: string;
    htmlForID: string;
    handleOnChange: any;
    settings?: boolean;
    htmlForIDSetting?: string;
    settingsValue?: string;
    handleOnChangeSettings?: any;
}

export default function addTexture(props: AddTextureProps) {
  return (
    <>
        <div className="editFormGroup">
            <label className="fileInputLabelmap" htmlFor={props.htmlForID}>
                <AddIcon 
                    w={8} 
                    h={8}
                    margin="5px"
                    bgColor="teal.400" 
                    padding="5px" 
                    borderRadius="6px" 
                    color="white"
                    _hover={{ bgColor: "teal.600", padding: "8px", borderRadius: "10px" }}
                    transition={"ease-in-out 0.2s"}
                />
                {props.MapURL ? (
                    <img
                        className="fileInputImgmap"
                        src={props.MapURL}
                        alt=""
                    />
                ) : (props.Map && (
                    <img
                        className="fileInputImgmap"
                        src={props.Map}
                        alt=""
                    />
                ))}
                {props.Name}
            </label>
            <input
                type="file"
                accept="image/jpeg,image/png"
                id={props.htmlForID}
                style={{ display: "none" }}
                onChange={props.handleOnChange}
            />

            {props.settings && (
                <>
                    <label className="InputLabelmap" htmlFor={props.htmlForIDSetting}>
                        Изменить:
                    </label>
                    <div className="InputDiv">
                        <input
                            className={"Rangemap"}
                            type="range"
                            value={props.settingsValue}
                            min="0"
                            max="1"
                            step="0.1"
                            id="metalnessRange"
                            onChange={props.handleOnChangeSettings}
                        />
                        <input
                            className="Inputmap"
                            type="number"
                            placeholder="Set Metalness"
                            id={props.htmlForIDSetting}
                            value={props.settingsValue}
                            min="0"
                            max="1"
                            step="0.1"
                            onChange={props.handleOnChangeSettings}
                        />
                    </div>
                </>
            )}
        </div>
    </>
  )
}
