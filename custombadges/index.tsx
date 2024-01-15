/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// This plugin is a port from Alyxia's Vendetta plugin
/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import { BadgePosition, BadgeUserArgs, ProfileBadge } from "@api/Badges";
import ErrorBoundary from "@components/ErrorBoundary";
import { Flex } from "@components/Flex";
import { Margins } from "@utils/margins";
import { closeModal, Modals, openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { Button, Forms, Toasts } from "@webpack/common";

let CustomBadges = {} as Record<string, Array<Record<"description" | "icon", string>>>;

async function loadBadges(noCache = false) {
    CustomBadges = {};
    const init = {} as RequestInit;
    if (noCache)
        init.cache = "no-cache";
    CustomBadges = await fetch("https://raw.githubusercontent.com/sampathgujarathi/CustomBadges/main/badges.json", init)
        .then(r => r.json());
}


export default definePlugin({
    name: "customBadges",
    description: "Add custom badges to your profile.",
    authors: [{ id: 984015688807100419n, name: "Sampath" }],
    patches: [
        /* Patch the badge list component on user profiles */
        {
            find: "Messages.PROFILE_USER_BADGES,role:",
            replacement: [
                {
                    match: /&&(\i)\.push\(\{id:"premium".+?\}\);/,
                    replace: "$&$1.unshift(...Vencord.Api.Badges._getCustomBadges(arguments[0]));",
                },
                {
                    // alt: "", aria-hidden: false, src: originalSrc
                    match: /alt:" ","aria-hidden":!0,src:(?=(\i)\.src)/,
                    // ...badge.props, ..., src: badge.image ?? ...
                    replace: "...$1.props,$& $1.image??"
                },
                // replace their component with ours if applicable
                {
                    match: /(?<=text:(\i)\.description,spacing:12,)children:/,
                    replace: "children:$1.component ? () => $self.renderBadgeComponent($1) :"
                },
                // conditionally override their onClick with badge.onClick if it exists
                {
                    match: /href:(\i)\.link/,
                    replace: "...($1.onClick && { onClick: $1.onClick }),$&"
                }
            ]
        }
    ],
    settingsAboutComponent: () => (
        <Forms.FormSection>
            <Forms.FormTitle tag="h3">Usage</Forms.FormTitle>
            <Forms.FormText>
                After enabling this plugin, you will see custom badges from people also using this plugin. <br />
                To set Custom Badge:
                <ul>
                    <li>Join https://discord.com/invite/ffmkewQ4R7 or contact sampathgujarathi.</li>
                    <li>Send your custom badge image and name.</li>
                    <li>You will recieve badge it asap!!</li>
                    <li>Else you can direct pull request for badge in repo</li>
                </ul><br />
            </Forms.FormText>
        </Forms.FormSection>
    ),
    toolboxActions: {
        async "Refetch Badges"() {
            await loadBadges(true);
            Toasts.show({
                id: Toasts.genId(),
                message: "Successfully refetched badges!",
                type: Toasts.Type.SUCCESS
            });
        }
    },

    async start() {
        await loadBadges();
    },

    renderBadgeComponent: ErrorBoundary.wrap((badge: ProfileBadge & BadgeUserArgs) => {
        const Component = badge.component!;
        return <Component {...badge} />;
    }, { noop: true }),


    getCustomUserBadges(userId: string) {
        return CustomBadges[userId]?.map(badge => ({
            image: badge.icon,
            description: badge.description,
            position: BadgePosition.START,
            props: {
                style: {
                    borderRadius: "50%",
                    transform: "scale(0.9)" // The image is a bit too big compared to default badges
                }
            },
            onClick() {
                const modalKey = openModal(props => (
                    <ErrorBoundary noop onError={() => {
                        closeModal(modalKey);
                        VencordNative.native.openExternal("https://github.com/sampathgujarathi/CustomBadges");
                    }}>
                        <Modals.ModalRoot {...props}>
                            <Modals.ModalHeader>
                                <Flex style={{ width: "100%", justifyContent: "center" }}>
                                    <Forms.FormTitle
                                        tag="h2"
                                        style={{
                                            width: "100%",
                                            textAlign: "center",
                                            margin: 0
                                        }}
                                    >
                                        <svg
                                            aria-hidden="true"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            width="16"
                                            style={{ marginRight: "0.5em", transform: "translateY(2px)" }}
                                        >
                                            <path
                                                fill="#db61a2"
                                                fill-rule="evenodd"
                                                d="M4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.565 20.565 0 008 13.393a20.561 20.561 0 003.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.75.75 0 01-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5zM8 14.25l-.345.666-.002-.001-.006-.003-.018-.01a7.643 7.643 0 01-.31-.17 22.075 22.075 0 01-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.08 22.08 0 01-3.744 2.584l-.018.01-.006.003h-.002L8 14.25zm0 0l.345.666a.752.752 0 01-.69 0L8 14.25z"
                                            />
                                        </svg>
                                        Custom Badges
                                    </Forms.FormTitle>
                                </Flex>
                            </Modals.ModalHeader>
                            <Modals.ModalContent>
                                <div style={{ padding: "1em" }}>
                                    <Forms.FormText>
                                        This Custom Badge
                                    </Forms.FormText>
                                    <Forms.FormText className={Margins.top20}>
                                        Please consider supporting the development of Custom Badges by giving a star in github. It would mean a lot!!
                                    </Forms.FormText>
                                </div>
                            </Modals.ModalContent>
                            <Modals.ModalFooter>
                                <Flex style={{ width: "100%", justifyContent: "center" }}>
                                    <Button
                                        {...props}
                                        look={Button.Looks.LINK}
                                        color={Button.Colors.TRANSPARENT}
                                        onClick={() => VencordNative.native.openExternal("https://github.com/sampathgujarathi/CustomBadges")}
                                    >
                                        <svg
                                            aria-hidden="true"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            width="16"
                                            style={{ marginRight: "0.5em", transform: "translateY(2px)" }}
                                        >
                                            <path
                                                fill="#db61a2"
                                                fill-rule="evenodd"
                                                d="M4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.565 20.565 0 008 13.393a20.561 20.561 0 003.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.75.75 0 01-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5zM8 14.25l-.345.666-.002-.001-.006-.003-.018-.01a7.643 7.643 0 01-.31-.17 22.075 22.075 0 01-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.08 22.08 0 01-3.744 2.584l-.018.01-.006.003h-.002L8 14.25zm0 0l.345.666a.752.752 0 01-.69 0L8 14.25z"
                                            />
                                        </svg>
                                        Join Discord Server
                                    </Button>
                                </Flex>
                            </Modals.ModalFooter>
                        </Modals.ModalRoot>
                    </ErrorBoundary>
                ));
            },
        }));
    }
});

